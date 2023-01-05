import { randomUUID } from "crypto"
import { Event } from "../types/Event"
import { Storage } from "./Storage"

/** A Bucket is a collection of events. It doesn't handle intervals and timeouts,
 * which are instead handled by the windowing system that created the bucket. But it 
 * can tells if an event belongs to him by comparing the event/processing time with
 * the his opening and closing timestamps. */
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

    /** Determin if the bucket is closed and watermarked */
    isDestroyed(): boolean {
        return !!this.destroyedAt
    }

    /** Determin if the bucket is closed, but non necessarily watermarked */
    isClosed(): boolean {
        return !!this.closedAt
    }

    isAfterEvent(event: Event<T>) {
        return this.openedAt > event.eventTime
    }

    /** Determin if the event belongs to this bucket by comparing the event time with 
     * the opening timestamp (and closing timestamp, if already closed) of the bucket.
     * Always return false is the bucket is already destroyed (aka watermarked). */
    ownsEvent(event: Event<T>): boolean {
        if (this.isDestroyed()) return false
        if (this.isClosed()) return event.eventTime >= this.openedAt && event.eventTime < this.closedAt
        else return event.eventTime >= this.openedAt
    }

    /** Insert a new event in the bucket storage */
    async push(event: Event<T>): Promise<void> {
        if (!event.bucketId) event.bucketId = this.id
        await this.storage.push(event as Required<Event<T>>)
    }

    /** Retrieves the events from the bucket storage and clear them */
    async flush(): Promise<Event<T>[]> {
        return await this.storage.flush(this.id)
    }

    /** Retrieves the events from the bucket storage without deleting them */
    async get(): Promise<Event<T>[]> {
        return await this.storage.flush(this.id)
    }

    async clear(): Promise<void> {
        await this.storage.clear(this.id)
    }

    /** close the bucket getting or flushing the stored events belonging to it.
     * Execute the passed callback to consume the events and destroy the bucket. */
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