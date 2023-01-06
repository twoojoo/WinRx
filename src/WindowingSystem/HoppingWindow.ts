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
    // private buckets: { [key: EventKey]: Bucket<T>[] } = {}

    private lastHopIndex: number = 0
    private buckets: { [key: EventKey]: Bucket<T> }[] = []

    //every window uses this timestamp as starting timestamp
    private lastHopTimestamp: number
    private startupTimestamp: number

    constructor(options: HoppingWindowOptions<T>) {
        super(options)
        this.size = toMs(options.size)

        //if hop = size force next window to start after previous
        if (this.size == toMs(options.hop)) this.hop = toMs(options.hop) + 1
        else this.hop = toMs(options.hop)
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        this.startupTimestamp = Date.now()
        this.setOpeningInterval()
        this.setClosingInterval(subscriber)
    }

    async onDequeuedEvent(subscriber: Subscriber<T[]>, event: DequeuedEvent<T>): Promise<void> {
        const eventKey = event.eventKey
        this.buckets.forEach(b => { if (!b[eventKey]) b[eventKey] = undefined })
        // const lastCreatedIndex = this.buckets.length - 1

        // // create first bucket if missing
        // if (!this.buckets[this.lastCreatedIndex][eventKey]) {
        //     this.buckets[this.lastHopIndex][eventKey] = new Bucket(this.stateManager, this.logger, this.lastHopTimestamp)
        // }

        //push to event owners
        // for (let i = 0; i < this.buckets.length; i++) {
        //     if (this.buckets[i][eventKey]?.ownsEvent(event)) {
        //         this.buckets[i][eventKey].push(event)
        //     }
        // }
    }

    async closeBuckets(subscriber: Subscriber<T[]>) {
        this.lastHopIndex

        // for (let )
        // for (let key in this.buckets) {
        //     if (!this.buckets[key][0]) continue

        //     const bucketToClose = await this.buckets[key].shift()
        //     bucketToClose.close(
        //         this.watermark,
        //         "flush",
        //         events => {
        //             this.release(subscriber, events)
        //             this.closedBuckets[key] = this.closedBuckets[key]?.filter(b => b.id != bucketToClose.id) || []
        //         }
        //     )
        // }
    }

    setOpeningInterval() {
        this.lastHopTimestamp = Date.now()
        setInterval(() => {
            this.lastHopTimestamp = this.lastHopTimestamp + this.hop + 1
        }, this.hop)
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