import { Subscriber } from "rxjs"
import { DequeuedEvent, EventKey } from "../Types/Event"
import { Bucket } from "../Models/Bucket"
import { Duration, toMs } from "../Types/Duration"
import { KeyedWindowingSystem, KeyedWindowingOptions } from "./model/KeyedWindowingSystem"

export type SlidingWindowOptions<T> = KeyedWindowingOptions<T> & {
    size: Duration
}

export class SlidingWindow<T> extends KeyedWindowingSystem<T> {
    private size: number

    private buckets: { [key: EventKey]: Bucket<T>[] } = {}
    private closedBuckets: { [key: EventKey]: Bucket<T>[] } = {}

    constructor(options: SlidingWindowOptions<T>) {
        super(options)

        this.size = toMs(options.size)
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        this.logWindowStart("sliding")
    }

    async onDequeuedEvent(subscriber: Subscriber<T[]>, event: DequeuedEvent<T>): Promise<void> {
        const eventKey = event.eventKey
        let assigned = false

        //late data
        for (let bucket of (this.closedBuckets[eventKey] || [])) {
            if (bucket.ownsEvent(event)) {
                assigned = true
                await bucket.push(event)
            }
        }

        const eventBucket = new Bucket(this.stateManager, this.logger, event.eventTime)
        const delay = Date.now() - event.eventTime

        if (delay < this.size) {
            assigned = true

            setTimeout(() => {
                this.closeBucket(subscriber, eventKey, eventBucket.id)
            }, this.size - delay)

            if (!this.buckets[eventKey]) this.buckets[eventKey] = []
            await this.buckets[eventKey].push(eventBucket)
        }

        for (let bucket of this.buckets[eventKey]) {
            if (bucket.ownsEvent(event)) {
                assigned = true
                await bucket.push(event)
            }
        }

        if (!assigned) {
            this.logger.warning(`[event lost]      | key: ${this.logger.cyan(event.eventKey)} - time ${this.logger.cyan(event.eventTime)}`)
        }
    }

    closeBucket(subscriber: Subscriber<T[]>, eventKey: EventKey, bucketId: string) {
        this.buckets[eventKey] = this.buckets[eventKey].filter(b => {
            const isTarget = b.id == bucketId

            if (isTarget) {
                if (!this.closedBuckets[eventKey]) this.closedBuckets[eventKey] = []
                this.closedBuckets[eventKey].push(b)

                b.close(
                    this.watermark,
                    "flush",
                    events => {
                        this.release(subscriber, events)
                        this.closedBuckets[eventKey] = this.closedBuckets[eventKey].filter(b => b.id != bucketId)
                    },
                    b.openedAt + this.size
                )
            }

            return !isTarget
        })
    }
}