import { Observer, Subscriber } from "rxjs"
import { Event, EventKey } from "../types/Event"
import { Bucket } from "../models/Bucket"
import { Window, WindowOptions } from "../models/Window"
import { Duration, toMs } from "../types/Duration"

export type SessionWindowOptions<T> = WindowOptions<T> & { size: Duration, timeout: Duration }

export class SessionWindow<T> extends Window<T> {
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

    constructor(options: SessionWindowOptions<T>) {
        super(options)

        this.maxDuration = toMs(options.size)
        this.timeoutSize = toMs(options.timeout)
    }

    async onStart(observer: Observer<T[]>): Promise<void> {
        return
    }

    async onComplete(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onError(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onDequeuedEvent(subscriber: Subscriber<T[]>, event: Event<T>): Promise<void> {
        const eventKey = event.eventKey

        //late data
        for (let bucket of (this.closedBuckets[eventKey] || [])) {
            if (bucket.ownsEvent(event)) {
                await bucket.push(event)
                return
            }
        }

        if (!this.buckets[eventKey] || !this.buckets[eventKey][0]) {
            const bucket = new Bucket(this.storage, event.eventTime)

            this.buckets[eventKey] = []
            this.buckets[eventKey].push({
                bucket,
                durationTimer: setTimeout(async () => await this.closeBucket(subscriber, eventKey, bucket.id), this.maxDuration),
                timeoutTimer: setTimeout(async () => await this.closeBucket(subscriber, eventKey, bucket.id), this.timeoutSize)
            })

            await this.buckets[eventKey][0].bucket.push(event)
        }

        else {
            const owner = this.buckets[eventKey].find(b => b.bucket.ownsEvent(event))
            if (!owner) {
                console.log(event.processingTime, this.buckets[eventKey][0].bucket.openedAt)
                console.log("NO OWNERS")
                return
            }

            clearTimeout(owner.timeoutTimer)
            owner.timeoutTimer = setTimeout(async () => await this.closeBucket(subscriber, eventKey, owner.bucket.id), this.timeoutSize)

            await owner.bucket.push(event)
        }
    }

    private async closeBucket(subscriber: Subscriber<T[]>, eventKey: EventKey, bucketId: string) {

        this.buckets[eventKey] = this.buckets[eventKey].filter(b => {
            const isTarget = b.bucket.id == bucketId

            if (isTarget) {

                // move bucket to the closed buckets object
                if (!this.closedBuckets[eventKey]) this.closedBuckets[eventKey] = []
                this.closedBuckets[eventKey].push(b.bucket)

                b.bucket.close(
                    this.watermark,
                    "flush",
                    events => {
                        this.release(subscriber, events)

                        //remove bucket from the closed bukcet object
                        this.closedBuckets[eventKey] = this.closedBuckets[eventKey].filter(b => b.id != bucketId)
                    }
                )
            }

            return !isTarget
        })
    }
}