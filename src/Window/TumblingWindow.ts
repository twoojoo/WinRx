import { Observer, Subscriber } from "rxjs"
import { Event, EventKey } from "../models/Event"
import { Window } from "../models/Window"
import { WindowingSystem, WindowOptions } from "../models/WindowingSystem"

export type TumblingWindowOptions<T> = WindowOptions<T> & { size: number }
export class TumblingWindow<T> extends WindowingSystem<T> {
    private size: number
    private windows: { [key: EventKey]: Window<T>[] } = {}

    constructor(options: TumblingWindowOptions<T>) {
        super(options)

        this.size = options.size
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        setInterval(() => {
            Object.values(this.windows).forEach(windows =>
                windows.forEach(win =>
                    win.close()
                )
            )

            setTimeout(async () => {
                for (let windowsByKey of Object.values(this.windows)) {
                    for (let win of windowsByKey) {
                        if (!win.isClosed()) continue
                        const events = await win.flush()
                        this.release(subscriber, events)
                        win.destroy()
                    }

                    windowsByKey = windowsByKey.filter(win => win.isDestroyed())
                }

            }, this.watermark)
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

        if (!this.windows[eventKey]) {
            this.windows[eventKey] = [new Window(this.storage)]
            this.windows[eventKey][0].push(event)
        } else {
            const openedWindow = this.windows[eventKey].find(win => !win.isClosed())
            if (!openedWindow) this.windows[eventKey].push(new Window(this.storage))
    
            const lastWinIndex = this.windows[eventKey].length -1
            await this.windows[eventKey][lastWinIndex].push(event)
        }
    }
}