import { Subscriber } from "rxjs"
import { WindowingSystem, WindowingOptions } from "../models/WindowingSystem"
import { Bucket } from "../models/Bucket"
import { DequeuedEvent, EventKey } from "../types/Event"
import { Duration, toMs } from "../types/Duration"

export type HoppingWindowOptions<T> = WindowingOptions<T> & { size: Duration, hop: Duration }

export class HoppingWindow<T> extends WindowingSystem<T> {
    private size: number
    private hop: number

    //window should be ordered by creation
    //index 0 always have the oldes alive window
    private buckets: { [key: EventKey]: Bucket<T>[] } = {}
    private closedBuckets: { [key: EventKey]: Bucket<T>[] } = {}

    //every window uses this timestamp as starting timestamp
    private lastHopTimestamp: number

    constructor(options: HoppingWindowOptions<T>) {
        super(options)
        this.size = toMs(options.size)

        //if hop = size force next window to start after previous
        if (options.size == options.hop) this.hop = toMs(options.hop) + 1
        else this.hop = toMs(options.hop)
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        this.setOpeningInterval()
        this.setClosingInterval(subscriber)
    }

    async onDequeuedEvent(subscriber: Subscriber<T[]>, event: DequeuedEvent<T>): Promise<void> {
        const eventKey = event.eventKey

        // create first bucket if missing
        if (!this.buckets[eventKey]) {
            this.buckets[eventKey] = []
        }
        if (!this.buckets[eventKey][0]) {
            // if (event.eventTime < this.lastHopTimestamp) return
            this.buckets[eventKey] = [new Bucket(this.stateManager, this.logger, this.lastHopTimestamp)]
        }

        // if event timestamp is greater than the last window creation date + hop then push a new window (but always max 2)
        if (this.buckets[eventKey].length == 1 && event.eventTime >= this.buckets[eventKey][0].openedAt + this.hop) {
            this.buckets[eventKey].push(new Bucket(this.stateManager, this.logger, this.lastHopTimestamp))
        }

        // get owner buckets and insert event
        const owners = this.buckets[eventKey].filter(win => win.ownsEvent(event))

        for (let bucket of owners) {
            await bucket.push(event)
        }
    }

    async closeBuckets(subscriber: Subscriber<T[]>) {
        for (let key in this.buckets) {
            if (!this.buckets[key][0]) continue

            const bucketToClose = await this.buckets[key].shift()
            bucketToClose.close(
                this.watermark,
                "flush",
                events => {
                    this.release(subscriber, events)
                    this.closedBuckets[key] = this.closedBuckets[key]?.filter(b => b.id != bucketToClose.id) || []
                }
            )
        }
    }

    setOpeningInterval() {
        setInterval(() => this.lastHopTimestamp = Date.now(), this.hop)
    }

    setClosingInterval(subscriber: Subscriber<T[]>) {
        let closeIntervalSize = this.hop
        let firstCloseTiemout = Math.abs(this.hop - this.size)
        if (this.hop >= this.size) firstCloseTiemout = this.size

        setTimeout(async () => {
            await this.closeBuckets(subscriber)

            setInterval(async () => {
                await this.closeBuckets(subscriber)
            }, closeIntervalSize)
            
        }, firstCloseTiemout)
    }
}