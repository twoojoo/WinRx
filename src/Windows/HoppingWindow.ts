import { Subscriber } from "rxjs"
import { Window, WindowOptions } from "../models/Window"
import { Bucket } from "../models/Bucket"
import { EventKey, Event } from "../models/Event"

export type HoppingWindowOptions<T> = WindowOptions<T> & { size: number, hop: number }

export class HoppingWindow<T> extends Window<T> {
    private size: number
    private hop: number

    //window should be ordered by creation
    //index 0 always have the oldes alive window
    private buckets: { [key: EventKey]: Bucket<T>[] } = {}

    //every window uses this timestamp as starting timestamp
    private lastHopTimestamp: number

    constructor(options: HoppingWindowOptions<T>) {
        super(options)
        this.size = options.size

        //if hop = size force next window to start after previous
        if (options.size == options.hop) this.hop = options.hop + 2
        else this.hop = options.hop
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        this.lastHopTimestamp = Date.now()

        //start first timer
        this.setTimeout(subscriber)

        //start a new timer with <hop> frequency
        setInterval(() => {
            this.lastHopTimestamp = Date.now()
            this.setTimeout(subscriber)
        }, this.hop)
    }

    async onComplete(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onError(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onEvent(subscriber: Subscriber<T[]>, event: Event<T>): Promise<void> {
        const eventKey = event.eventKey

        // create first window if missing
        if (!this.buckets[eventKey]) {
            this.buckets[eventKey] = []
        }

        // create first window if missing
        if (!this.buckets[eventKey][0]) {
            this.buckets[eventKey].push(new Bucket(this.storage, this.lastHopTimestamp))
        }

        // if event timestamp is greater than the last window creation date + hop then push a new window (but always max 2)
        if (this.buckets[eventKey].length == 1 && event.eventTime >= this.buckets[eventKey][0].openedAt + this.hop) {
            this.buckets[eventKey].push(new Bucket(this.storage, this.lastHopTimestamp))
        }

        // get owners and insert event
        const owners = this.buckets[eventKey].filter(win => win.ownsEvent(event))

        for (let win of owners) {
            win.push(event)
        }
    }

    setTimeout(subscriber: Subscriber<T[]>) {
        setTimeout(async () => {
            for (let key in this.buckets) {
                if (!this.buckets[key][0]) continue

                await this.buckets[key][0].close(
                    this.watermark,
                    "flush",
                    events => this.release(subscriber, events)
                )

                this.buckets[key].shift()
            }

        }, this.size)

    }
}