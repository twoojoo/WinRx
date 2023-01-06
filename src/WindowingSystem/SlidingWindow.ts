import { Subscriber } from "rxjs"
import { Event, EventKey } from "../types/Event"
import { Bucket } from "../models/Bucket"
import { WindowingSystem, WindowingOptions } from "../models/WindowingSystem"
import { Duration, toMs } from "../types/Duration"

export type SlidingWindowOptions<T> = WindowingOptions<T> & {
    size: Duration,
    condition: (events: T[]) => boolean
}

export class SlidingWindow<T> extends WindowingSystem<T> {
    private size: number
    private condition: (events: T[]) => boolean

    private buckets: { [key: EventKey]: Bucket<T>[] } = {}
    private closedBuckets: { [key: EventKey]: Bucket<T>[] } = {}

    constructor(options: SlidingWindowOptions<T>) {
        super(options)

        this.size = toMs(options.size)
        this.condition = options.condition
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onComplete(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onError(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onEvent(subscriber: Subscriber<T[]>, event: Event<T>): Promise<void> {
        const eventKey = event.eventKey
        console.log("incoming event", event.value)

        //late data
        for (let bucket of (this.closedBuckets[eventKey] || [])) {
            if (bucket.ownsEvent(event)) {
                console.log("event", event.value, "in closed bucket", bucket.id)
                await bucket.push(event)
            }
        }

        const eventBucket = new Bucket(this.stateManager, event.eventTime)
        setTimeout(() => this.closeBucket(subscriber, eventKey, eventBucket.id), this.size)

        if (!this.buckets[eventKey]) this.buckets[eventKey] = []
        this.buckets[eventKey].push(eventBucket)

        console.log("buckets number", this.buckets[eventKey].length)

        for (let bucket of this.buckets[eventKey]) {
            if (bucket.ownsEvent(event)) {
                console.log("event", event.value, "in opened bucket", bucket.id)
                await bucket.push(event)
            }
        }
    }

    closeBucket(subscriber: Subscriber<T[]>, eventKey: EventKey, bucketId: string) {
        
        this.buckets[eventKey] = this.buckets[eventKey].filter(b => {
            const isTarget = b.id == bucketId
            
            if (isTarget) {
                console.log("closing bucket", bucketId)

                // move bucket to the closed buckets object
                if (!this.closedBuckets[eventKey]) this.closedBuckets[eventKey] = []
                this.closedBuckets[eventKey].push(b)

                b.close(
                    this.watermark,
                    "flush",
                    events => {
                        //check window output condition
                        if (this.condition(events.map(e => e.value))) this.release(subscriber, events)

                        //remove bucket from the closed bukcet object
                        this.closedBuckets[eventKey] = this.closedBuckets[eventKey].filter(b => b.id != bucketId)
                    }
                )
            }

            return !isTarget
        })
    }
}