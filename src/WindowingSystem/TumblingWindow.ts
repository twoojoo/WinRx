import { Subscriber } from "rxjs"
import { DequeuedEvent, EventKey } from "../types/Event"
import { Bucket } from "../models/Bucket"
import { WindowingSystem, WindowingOptions } from "../models/WindowingSystem"
import { Duration, toMs } from "../types/Duration"

export type TumblingWindowOptions<T> = WindowingOptions<T> & { size: Duration }

export class TumblingWindow<T> extends WindowingSystem<T> {
    private size: number

    private currentBucket: Bucket<T>
    private closedBuckets: Bucket<T>[] = []

    private lastBucketTimestamp: number

    constructor(options: TumblingWindowOptions<T>) {
        super(options)
        this.size = toMs(options.size)
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        this.logWindowStart("tumbling")

        this.lastBucketTimestamp = Date.now()
        this.currentBucket = new Bucket(this.stateManager, this.logger, this.lastBucketTimestamp)

        setInterval(() => {
            this.lastBucketTimestamp = this.lastBucketTimestamp + this.size 
        
            this.closedBuckets.push(this.currentBucket)

            this.currentBucket.close(
                this.watermark,
                "flush",
                events => {
                    this.release(subscriber, events)
                    this.closedBuckets = this.closedBuckets.filter(b => b.isDestroyed())
                },
                this.lastBucketTimestamp
            )

            this.currentBucket = new Bucket(this.stateManager, this.logger, this.lastBucketTimestamp)
        }, this.size)
    }

    async onDequeuedEvent(subscriber: Subscriber<T[]>, event: DequeuedEvent<T>): Promise<void> {
        let assigned = false

        for (let bucket of this.closedBuckets) {
            if (bucket.ownsEvent(event)) {
                await bucket.push(event)
                assigned = true
                return
            }
        }

        if (this.currentBucket.ownsEvent(event)) {
            this.currentBucket.push(event)
            assigned = true
        }

        if (!assigned) {
            this.logger.warning(`[event lost]   :: key: ${this.logger.yellow(event.eventKey)} - time ${this.logger.yellow(event.eventTime)}`)
        }
    }
}