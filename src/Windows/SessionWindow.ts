import { Observer, Subscriber } from "rxjs"
import { Event, EventKey } from "../models/Event"
import { Window } from "../models/Window"
import { WindowingSystem, WindowOptions } from "../models/WindowingSystem"

export type SessionWindowOptions<T> = WindowOptions<T> & { size: number, timeout: number }

export class SessionWindow<T> extends WindowingSystem<T> {
    private maxDuration: number
    private timeoutSize: number

    private windows: {
        [key: EventKey]: {
            window: Window<T>
            durationTimer: NodeJS.Timeout,
            timeoutTimer: NodeJS.Timeout
        }[]
    } = {}

    constructor(options: SessionWindowOptions<T>) {
        super(options)

        this.maxDuration = options.size
        this.timeoutSize = options.timeout
    }

    async onStart(observer: Observer<T[]>): Promise<void> {
        return
    }

    async onComplete(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onError(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onEvent(subscriber: Subscriber<T[]>, event: Event<T>): Promise<void> {
        const eventKey = event.eventKey

        if (!this.windows[eventKey] || !this.windows[eventKey][0]) {
            const window = new Window(this.storage)

            console.log(window.ownsEvent(event))

            this.windows[eventKey] = []
            this.windows[eventKey].push({
                window,
                durationTimer: setTimeout(async () => await this.closeWindow(subscriber, eventKey, window.id), this.maxDuration),
                timeoutTimer: setTimeout(async () => await this.closeWindow(subscriber, eventKey, window.id), this.timeoutSize)
            })

            await this.windows[eventKey][0].window.push(event)
        }

        else {
            const owner = this.windows[eventKey].find(w => w.window.ownsEvent(event))
            if (!owner) return

            clearTimeout(owner.timeoutTimer)
            owner.timeoutTimer = setTimeout(async () => await this.closeWindow(subscriber, eventKey, owner.window.id), this.timeoutSize)

            await owner.window.push(event)
        }
    }

    private async closeWindow(subscriber: Subscriber<T[]>, eventKey: EventKey, windowId: string) {
        this.windows[eventKey] = this.windows[eventKey].filter(w => {
            const isTarget = w.window.id == windowId

            if (isTarget) {
                w.window.close(
                    this.watermark,
                    "flush",
                    events => this.release(subscriber, events)
                )
            }

            return !isTarget
        })
    }
}