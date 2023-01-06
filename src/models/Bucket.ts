import { randomUUID } from "crypto"
import { AssignedEvent, DequeuedEvent, IncomingEvent } from "../types/Event"
import { WinRxlogger } from "../utils/Logger"
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
    private logger: WinRxlogger

    constructor(storage: Storage<T>, logger: WinRxlogger, timestamp: number = Date.now()) {
        this.id = randomUUID()
        this.logger = logger
        this.openedAt = timestamp
        this.storage = storage
        this.logger.info(`[bucket opened]   :: id: ${this.logger.yellow(this.id)} - time: ${this.logger.yellow(this.openedAt)}`)
    }

    /** Determin if the bucket is closed and watermarked */
    isDestroyed(): boolean {
        return !!this.destroyedAt
    }

    /** Determin if the bucket is closed, but non necessarily watermarked */
    isClosed(): boolean {
        return !!this.closedAt
    }

    isAfterEvent(event: IncomingEvent<T>) {
        return this.openedAt > event.eventTime
    }

    /** Determin if the event belongs to this bucket by comparing the event time with 
     * the opening timestamp (and closing timestamp, if already closed) of the bucket.
     * Always return false is the bucket is already destroyed (aka watermarked). */
    ownsEvent(event: IncomingEvent<T>): boolean {
        if (this.isDestroyed()) return false
        if (this.isClosed()) return event.eventTime >= this.openedAt && event.eventTime < this.closedAt
        else return event.eventTime >= this.openedAt
    }

    /** Insert a new event in the bucket storage */
    async push(event: DequeuedEvent<T>): Promise<void> {
        const assignedEvent: AssignedEvent<T> = {...event, bucketId: this.id}
        if (!assignedEvent.bucketId) assignedEvent.bucketId = this.id
        await this.storage.push(assignedEvent)
    }

    /** Retrieves the events from the bucket storage and clear them */
    async flush(): Promise<AssignedEvent<T>[]> {
        return await this.storage.flush(this.id)
    }

    /** Retrieves the events from the bucket storage without deleting them */
    async get(): Promise<AssignedEvent<T>[]> {
        return await this.storage.flush(this.id)
    }

    async clear(): Promise<void> {
        await this.storage.clear(this.id)
    }

    /** close the bucket getting or flushing the stored events belonging to it.
     * Execute the passed callback to consume the events and destroy the bucket. */
    async close(watermark: number, mode: "flush" | "get", callback: (events: AssignedEvent<T>[]) => void) {
        if (this.closedAt) return
        this.closedAt = Date.now()

        this.logger.info(`[bucket closed]   :: id: ${this.logger.yellow(this.id)} - time: ${this.logger.yellow(this.closedAt)}`)

        setTimeout(async () => {
            // "get" | "flush"
            const events = await this[mode]()
            this.logger.info(`[bucket released] :: id: ${this.logger.yellow(this.id)} - key: ${this.logger.yellow(events[0].eventKey)} - items: ${this.logger.yellow(events.length)}`)
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