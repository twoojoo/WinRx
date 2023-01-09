import { Subject, Subscriber } from "rxjs"
import { DequeuedEvent, EventKey } from "../Types/Event"
import { Bucket } from "../Models/Bucket"
import { WindowingSystem, WindowingOptions } from "./model/WindowingSystem"
import { Duration, toMs } from "../Types/Duration"
import { InnerEvent } from "../event"

export type TumblingWindowOptions<R> = WindowingOptions<R> & { size: Duration }

export class TumblingWindow<T extends InnerEvent<R>, R> extends WindowingSystem<T, R> {
    private size: number

    private currentBucket: Bucket<T>
    private closedBuckets: Bucket<T>[] = []

    private lastBucketTimestamp: number

    constructor(options: TumblingWindowOptions<R>) {
        super(options)
        this.size = toMs(options.size)
    }

    async onStart(sub: Subject<InnerEvent<R[]>>): Promise<void> {
        this.lastBucketTimestamp = Date.now()
        this.currentBucket = new Bucket(this.stateManager, this.lastBucketTimestamp)

        setInterval(() => {
            this.lastBucketTimestamp = this.lastBucketTimestamp + this.size 
        
            this.closedBuckets.push(this.currentBucket)

            this.currentBucket.close(
                this.watermark,
                "flush",
                events => {
                    this.release(sub, events)
                    this.closedBuckets = this.closedBuckets.filter(b => b.isDestroyed())
                },
                this.lastBucketTimestamp
            )

            this.currentBucket = new Bucket(this.stateManager, this.lastBucketTimestamp)
        }, this.size)
    }

    async onDequeuedEvent(sub: Subject<InnerEvent<R[]>>, event: DequeuedEvent<T>): Promise<void> {
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

        // if (!assigned) {
        //     this.logger.warning(`[event lost]   :: key: ${this.logger.yellow(event.eventKey)} - time ${this.logger.yellow(event.eventTime)}`)
        // }
    }
}