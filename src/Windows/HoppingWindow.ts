import { Subscriber } from "rxjs"
import { WindowingSystem, WindowOptions } from "../models/WindowingSystem"
import { Window } from "../models/Window"
import { EventKey, Event } from "../models/Event"

// let counter = 0

export type HoppingWindowOptions<T> = WindowOptions<T> & { size: number, hop: number }

export class HoppingWindow<T> extends WindowingSystem<T> {
    private size: number
    private hop: number

    //window should be ordered by creation
    //index 0 always have the oldes alive window
    private windows: {
        [key: EventKey]: Window<T>[]
    } = {}

    private lastHopTimestamp: number

    constructor(options: HoppingWindowOptions<T>) {
        super(options)
        this.size = options.size
        this.hop = options.hop
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        this.lastHopTimestamp = Date.now()

        setInterval(() => {
            this.lastHopTimestamp = Date.now()

            setTimeout(() => {

                for (let key in this.windows) {

                    if (this.windows[key][0]) continue

                    this.windows[key][0].close(
                        this.watermark,
                        "flush",
                        events => this.release(subscriber, events)
                    )

                    this.windows[key].shift()
                }

            }, this.size)

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
        if (!this.windows[eventKey]) 
            this.windows[eventKey] = []

        // create first window if missing
        if (!this.windows[eventKey][0]) 
            this.windows[eventKey].push(new Window(this.storage, this.lastHopTimestamp))

        // if event timestamp is greater than the last window creation date + hop then push a new window (but always max 2)
        if (this.windows[eventKey].length == 1 && event.eventTime >= this.windows[eventKey][0].openedAt + this.hop) 
            this.windows[eventKey].push(new Window(this.storage, this.lastHopTimestamp))

        // get owners and insert event
        const owners = this.windows[eventKey].filter(win => win.ownsEvent(event))
        for (let win of owners) win.push(event)
    }
}