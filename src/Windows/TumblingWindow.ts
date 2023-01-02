import { Observer, Subscriber } from "rxjs"
import { Event, EventKey } from "../models/Event"
import { Bucket } from "../models/Bucket"
import { Window, WindowOptions } from "../models/Window"

export type TumblingWindowOptions<T> = WindowOptions<T> & { size: number }
export class TumblingWindow<T> extends Window<T> {
    private size: number
    private buckets: { [key: EventKey]: Bucket<T>[] } = {}

    constructor(options: TumblingWindowOptions<T>) {
        super(options)

        this.size = options.size
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