import { randomUUID } from "crypto"
import { Event } from "./Event"
import { Storage } from "./Storage"

export class Window<T> {
    readonly id: string
    readonly openedAt: number

    private storage: Storage<T>
    private closedAt: number | undefined

    constructor(storage: Storage<T>) {
        this.id = randomUUID()
        this.openedAt = Date.now()
        this.storage = storage
    }

    ownsEvent(event: Event<T>): boolean {
        if (this.closedAt) return event.eventTime > this.openedAt && event.eventTime <= this.closedAt
        else return event.eventTime >= this.openedAt
    }

    async push(event: Required<Event<T>>): Promise<void> {
        if (this.closedAt) throw Error("window is already closed")
        await this.storage.push(event)
    }

    async flush(): Promise<Event<T>[]> {
        return await this.storage.flush(this.id)
    }

    async get(): Promise<Event<T>[]> {
        return await this.storage.flush(this.id)
    }

    async close() {
        this.closedAt = Date.now()
    }
}