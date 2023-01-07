import { Subscriber } from "rxjs"
import { DequeuedEvent, EventKey } from "../types/Event"
import { Bucket } from "../models/Bucket"
import { WindowingOptions } from "../models/WindowingSystem"
import { Duration, toMs } from "../types/Duration"
import { KeyedWindowingSystem, KeyedWindowingOptions } from "../models/KeyedWindowingSystem"

export type SlidingWindowOptions<T> = KeyedWindowingOptions<T> & {
    size: Duration,
    // condition: (events: T[]) => boolean
}

export class SlidingWindow<T> extends KeyedWindowingSystem<T> {
    private size: number
    private condition: (events: T[]) => boolean

    private buckets: { [key: EventKey]: Bucket<T>[] } = {}
    private closedBuckets: { [key: EventKey]: Bucket<T>[] } = {}

    constructor(options: SlidingWindowOptions<T>) {
        super(options)

        this.size = toMs(options.size)
        // this.condition = options.condition
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
            this.buckets[eventKey].push(eventBucket)
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
                        // if (this.condition(events.map(e => e.value))) 
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