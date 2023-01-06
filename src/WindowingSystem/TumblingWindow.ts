import { Subscriber } from "rxjs"
import { DequeuedEvent, EventKey } from "../types/Event"
import { Bucket } from "../models/Bucket"
import { WindowingSystem, WindowingOptions } from "../models/WindowingSystem"
import { Duration, toMs } from "../types/Duration"

export type TumblingWindowOptions<T> = WindowingOptions<T> & { size: Duration }

export class TumblingWindow<T> extends WindowingSystem<T> {
    private size: number

    private buckets: { [key: EventKey]: Bucket<T>[] } = {}
    private closedBuckets: { [key: EventKey]: Bucket<T>[] } = {}

    private lastBucketTimestamp: number

    constructor(options: TumblingWindowOptions<T>) {
        super(options)
        this.size = toMs(options.size)
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        this.lastBucketTimestamp = Date.now()

        setInterval(() => {
            for (let key in this.buckets) {

                //close key windows
                for (let bucket of this.buckets[key]) {
                    this.lastBucketTimestamp = Date.now() +1

                    bucket.close(
                        this.watermark,
                        "flush",
                        events => this.release(subscriber, events),
                        this.lastBucketTimestamp
                    )
                }

                //clear key windows
                this.buckets[key] = this.buckets[key].filter(b => b.isDestroyed())
            }
        }, this.size)
    }

    async onDequeuedEvent(subscriber: Subscriber<T[]>, event: DequeuedEvent<T>): Promise<void> {
        const eventKey = event.eventKey

        for (let bucket of (this.closedBuckets[eventKey] || [])) {
            //if an event belongs to a closed bucket, then it can't belog to anoter bucket
            if (bucket.ownsEvent(event)) {
                await bucket.push(event)
                return
            }
        }

        if (!this.buckets[eventKey]) {
            this.buckets[eventKey] = [new Bucket(this.stateManager, this.logger, this.lastBucketTimestamp)]
            this.buckets[eventKey][0].push(event)
        } else {
            const openedWindow = this.buckets[eventKey].find(b => !b.isClosed())
            if (!openedWindow) this.buckets[eventKey].push(new Bucket(this.stateManager, this.logger, this.lastBucketTimestamp))

            const lastWinIndex = this.buckets[eventKey].length - 1
            await this.buckets[eventKey][lastWinIndex].push(event)
        }
    }
}