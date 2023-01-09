import { Observer, Subject, Subscriber } from "rxjs"
import { DequeuedEvent, EventKey } from "../Types/Event"
import { Bucket } from "../Models/Bucket"
import { Duration, toMs } from "../Types/Duration"
import { KeyedWindowingOptions, KeyedWindowingSystem } from "./model/KeyedWindowingSystem"
import { InnerEvent } from "../event"

export type SessionWindowOptions<T extends InnerEvent<R>, R> = KeyedWindowingOptions<T, R> & { size: Duration, timeout: Duration }

export class SessionWindow<T extends InnerEvent<R>, R> extends KeyedWindowingSystem<T, R> {
    private maxDuration: number
    private timeoutSize: number

    private buckets: {
        [key: EventKey]: {
            bucket: Bucket<T>
            durationTimer: NodeJS.Timeout,
            timeoutTimer: NodeJS.Timeout
        }[]
    } = {}

    private closedBuckets: { [key: EventKey]: Bucket<T>[] } = {}

    constructor(options: SessionWindowOptions<T, R>) {
        super(options)

        this.maxDuration = toMs(options.size)
        this.timeoutSize = toMs(options.timeout)
    }

    async onStart(sub: Subject<InnerEvent<R[]>>): Promise<void> {
        return
    }

    async onDequeuedEvent(sub: Subject<InnerEvent<R[]>>, event: DequeuedEvent<T>): Promise<void> {
        const eventKey = event.eventKey
        let assigned = false

        for (let bucket of (this.closedBuckets[eventKey] || [])) {
            if (bucket.ownsEvent(event)) {
                await bucket.push(event)
                assigned = true
                return
            }
        }

        if (!assigned) {
            if (!this.buckets[eventKey] || !this.buckets[eventKey][0]) {
                const bucket = new Bucket(this.stateManager, event.eventTime)

                this.buckets[eventKey] = []
                this.buckets[eventKey].push({
                    bucket,
                    durationTimer: setTimeout(async () => await this.closeBucket(sub, eventKey, bucket.id), this.maxDuration),
                    timeoutTimer: setTimeout(async () => await this.closeBucket(sub, eventKey, bucket.id), this.timeoutSize)
                })

                assigned = true
                await this.buckets[eventKey][0].bucket.push(event)

            } else {
                const owner = this.buckets[eventKey].find(b => b.bucket.ownsEvent(event))

                if (owner) {
                    assigned = true
                    clearTimeout(owner.timeoutTimer)
                    owner.timeoutTimer = setTimeout(async () => await this.closeBucket(sub, eventKey, owner.bucket.id), this.timeoutSize)

                    await owner.bucket.push(event)
                }

            }

            if (!assigned) {
                this.logger.warning(`[event lost]   :: key: ${this.logger.cyan(event.eventKey)} - time ${this.logger.cyan(event.eventTime)}`)
            }
        }
    }

    private async closeBucket(sub: Subject<InnerEvent<R[]>>, eventKey: EventKey, bucketId: string) {

        this.buckets[eventKey] = this.buckets[eventKey].filter(b => {
            const isTarget = b.bucket.id == bucketId

            if (isTarget) {
                if (!this.closedBuckets[eventKey]) this.closedBuckets[eventKey] = []
                this.closedBuckets[eventKey].push(b.bucket)

                b.bucket.close(
                    this.watermark,
                    "flush",
                    events => {
                        this.release(sub, events)
                        this.closedBuckets[eventKey] = this.closedBuckets[eventKey].filter(b => b.id != bucketId)
                    }
                )
            }

            return !isTarget
        })
    }
}