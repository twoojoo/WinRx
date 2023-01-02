import { randomUUID } from "crypto"
import { Event } from "./Event"
import { Storage } from "./Storage"

/** A Bucket is a collection of events. It doesn't handle intervals and timeouts,
 * which are instead handled by the windowing system that created the window. */
export class Bucket<T> {
    readonly id: string
    readonly openedAt: number

    private storage: Storage<T>
    private closedAt: number | undefined
    private destroyedAt: number | undefined

    constructor(storage: Storage<T>, timestamp: number = Date.now()) {
        this.id = randomUUID()
        this.openedAt = timestamp
        this.storage = storage
    }

    /** Determin if the window is closed and watermarked */
    isDestroyed(): boolean {
        return !!this.destroyedAt
    }

    /** Determin if the window is closed, but non necessarily watermarked */
    isClosed(): boolean {
        return !!this.closedAt
    }

    isAfterEvent(event: Event<T>) {
        return this.openedAt > event.eventTime
    }

    /** Determin if the event belongs to this window by comparing the event time with 
     * the opening timestamp (and closing timestamp, if already closed) of the window.
     * Always return false is the window is already destroyed (aka watermarked). */
    ownsEvent(event: Event<T>): boolean {
        if (this.isDestroyed()) return false
        if (this.isClosed()) return event.eventTime > this.openedAt && event.eventTime <= this.closedAt
        else return event.eventTime >= this.openedAt
    }

    /** Insert a new window event in the storage */
    async push(event: Event<T>): Promise<void> {
        if (!event.windowId) event.windowId = this.id
        await this.storage.push(event as Required<Event<T>>)
    }

    /** Retrieves the window events from the storage and clear them */
    async flush(): Promise<Event<T>[]> {
        return await this.storage.flush(this.id)
    }

    /** Retrieves the window events from the storage without deleting them */
    async get(): Promise<Event<T>[]> {
        return await this.storage.flush(this.id)
    }

    /** close the window getting or flushing the stored events belonging to it.
     * Execute the passed callback to consume the events and destroy the winow. */
    async close(watermark: number, mode: "flush" | "get", callback: (events: Event<T>[]) => void) {
        if (this.closedAt) return
        this.closedAt = Date.now()

        setTimeout(async () => {
            // "get" | "flush"
            const events = await this[mode]()
            callback(events)
            this.destroy()
        }, watermark)
    }

    /** Destroy = closed + watermarked */
    private destroy() {
        if (this.destroyedAt) return
        this.destroyedAt = Date.now()
    }
}