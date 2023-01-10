import { Subscriber } from "rxjs"
import { WindowingSystem, WindowingOptions } from "../Models/WindowingSystem"
import { Bucket } from "../Models/Bucket"
import { DequeuedEvent, EventKey } from "../Types/Event"
import { Duration, toMs } from "../Types/Duration"

export type HoppingWindowOptions<T> = WindowingOptions<T> & { size: Duration, hop: Duration }

export class HoppingWindow<T> extends WindowingSystem<T> {
    private size: number
    private hop: number

    private buckets: Bucket<T>[] = []
    private closedBuckets: Bucket<T>[] = []
    private lastHopTimestamp: number

    constructor(options: HoppingWindowOptions<T>) {
        super(options)
        this.size = toMs(options.size)

        if (this.size == toMs(options.hop)) this.hop = toMs(options.hop) + 1
        else this.hop = toMs(options.hop)
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        this.logWindowStart("hopping")
        this.setOpeningInterval()
        this.setClosingInterval(subscriber)
    }

    async onDequeuedEvent(subscriber: Subscriber<T[]>, event: DequeuedEvent<T>): Promise<void> {
        let assigned = false
        let owners = 0

        for (let bucket of this.closedBuckets) {
            if (bucket.ownsEvent(event)) {
                assigned = true
                owners++
                await bucket.push(event)
            }
        }

        for (let bucket of this.buckets) {
            if (bucket.ownsEvent(event)) {
                assigned = true
                owners++
                await bucket.push(event)
            }
        }

        if (!assigned) {
            this.logger.warning(`[event lost]   :: key: ${this.logger.yellow(event.eventKey)} - time ${this.logger.yellow(event.eventTime)}`)
        }

        if (owners > 2) {
            console.log(">2", Date.now())
        }
    }

    openBucket() {
        this.lastHopTimestamp = this.lastHopTimestamp ? this.lastHopTimestamp + this.hop : Date.now()
        this.buckets.push(new Bucket(this.stateManager, this.logger, this.lastHopTimestamp))
    }

    async closeBucket(subscriber: Subscriber<T[]>) {
        const bucketToClose = this.buckets.shift()
        this.closedBuckets.push(bucketToClose)

        bucketToClose.close(
            this.watermark,
            "flush",
            events => {
                this.release(subscriber, events)
                this.closedBuckets = this.closedBuckets.filter(b => b.id != bucketToClose.id) || []
            },
            bucketToClose.openedAt + this.size
        )
    }

    setOpeningInterval() {
        this.openBucket()
        setInterval(() => {
            this.openBucket()
        }, this.hop)
    }

    setClosingInterval(subscriber: Subscriber<T[]>) {
        setTimeout(async () => {
            this.closeBucket(subscriber)
            setInterval(async () => {
                this.closeBucket(subscriber)
            }, this.hop)
        }, this.size)
    }
}