import { Subscriber } from "rxjs"
import { Event, EventKey } from "../types/Event"
import { Bucket } from "../models/Bucket"
import { Window, WindowOptions } from "../models/Window"
import { Duration, toMs } from "../types/Duration"

export type SlidingWindowOptions<T> = WindowOptions<T> & { size: Duration }

export class SlidingWindow<T> extends Window<T> {
    private size: number
    private buckets: { [key: EventKey]: Bucket<T>[] } = {}

    constructor(options: SlidingWindowOptions<T>) {
        super(options)

        this.size = toMs(options.size)
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        setInterval(() => {
            for (let key in this.buckets) {

                //close key windows
                for (let win of this.buckets[key]) {
                    win.close(
                        this.watermark, 
                        "flush",
                        events => this.release(subscriber, events)
                    )
                }

                //clear key windows
                this.buckets[key] = this.buckets[key].filter(b => b.isDestroyed())
            }
        }, this.size)
    }

    async onComplete(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onError(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onEvent(subscriber: Subscriber<T[]>, event: Event<T>): Promise<void> {
        const eventKey = event.eventKey

        if (!this.buckets[eventKey]) {
            this.buckets[eventKey] = [new Bucket(this.storage)]
            this.buckets[eventKey][0].push(event)
        } else {
            const openedWindow = this.buckets[eventKey].find(b => !b.isClosed())
            if (!openedWindow) this.buckets[eventKey].push(new Bucket(this.storage))
    
            const lastWinIndex = this.buckets[eventKey].length -1
            await this.buckets[eventKey][lastWinIndex].push(event)
        }
    }
}