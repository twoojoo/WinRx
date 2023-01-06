import { Subscriber } from "rxjs"
import { Event, EventKey } from "../types/Event"
import { WindowingSystem, WindowingOptions } from "../models/WindowingSystem"
import { randomUUID } from "crypto"

export type CountingWindowOptions<T> = WindowingOptions<T> & { size: number }

export class CountingWindow<T> extends WindowingSystem<T> {
    private _size: number
    private _windows: {[key: EventKey]: {
        id: string,
        value: number 
    }} = {}

    constructor(options: CountingWindowOptions<T>) {
        super(options)
        this._size = options.size
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onEvent(subscriber: Subscriber<T[]>, event: Event<T>): Promise<void> {
        const key = event.eventKey()

        if (!this._windows[key]) this._windows[key] = {
            id: randomUUID(),
            value: 0
        }

        this._counters[key] ++

        await this._stateManager.push(event)
    }
}