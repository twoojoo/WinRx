import { randomUUID } from "crypto"
import { Event } from "./Event"
import { Storage } from "./Storage"

export class Window<T> {
    readonly id: string
    readonly openedAt: number

    private storage: Storage<T>
    private closedAt: number | undefined
    private destroyedAt:number | undefined

    constructor(storage: Storage<T>) {
        this.id = randomUUID()
        this.openedAt = Date.now()
        this.storage = storage
    }

    isDestroyed(): boolean {
        return !!this.destroyedAt
    }

    isClosed(): boolean {
        return !!this.closedAt
    }

    ownsEvent(event: Event<T>): boolean {
        if (this.isClosed()) return event.eventTime > this.openedAt && event.eventTime <= this.closedAt
        else return event.eventTime >= this.openedAt
    }

    async push(event: Event<T>): Promise<void> {
        // if (this.closedAt) throw Error("window is already closed")
        if (!event.windowId) event.windowId = this.id
        await this.storage.push(event as Required<Event<T>>)
    }

    async flush(): Promise<Event<T>[]> {
        return await this.storage.flush(this.id)
    }

    async get(): Promise<Event<T>[]> {
        return await this.storage.flush(this.id)
    }

    async close() {
        if (this.closedAt) return
        this.closedAt = Date.now()
    }

    async destroy() {
        if (this.destroyedAt) return
        this.destroyedAt = Date.now()
    }
}