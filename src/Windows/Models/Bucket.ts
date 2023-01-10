import { randomUUID } from "crypto"
import { AssignedEvent, DequeuedEvent, IncomingEvent } from "../Types/Event"
import { WinRxlogger } from "../Utils/Logger"
import { StateMananger } from "./StateManager"

/** A Bucket is a collection of events. It doesn't handle intervals and timeouts,
 * which are instead handled by the windowing system that created the bucket. But it 
 * can tells if an event belongs to him by comparing the event/processing time with
 * the his opening and closing timestamps. */
export class Bucket<T> {
    readonly id: string
    readonly openedAt: number

    private stateManager: StateMananger<T>
    private closedAt: number | undefined = undefined
    private destroyedAt: number | undefined = undefined
    private logger: WinRxlogger

    private eventCounter = 0

    constructor(stateManager: StateMananger<T>, logger: WinRxlogger, timestamp: number = Date.now()) {
        this.id = randomUUID()
        this.logger = logger
        this.openedAt = timestamp
        this.stateManager = stateManager
        this.logger.info(`[bucket opened]   | id: ${this.logger.cyan(this.id)} - time: ${this.logger.cyan(this.openedAt)}`)
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

    /** Insert a new event in the bucket stateManager */
    async push(event: DequeuedEvent<T>): Promise<void> {
        this.eventCounter++
        const assignedEvent: AssignedEvent<T> = {...event, bucketId: this.id}
        if (!assignedEvent.bucketId) assignedEvent.bucketId = this.id
        await this.stateManager.push(assignedEvent)
    }

    /** Retrieves the events from the bucket stateManager and clear them */
    async flush(): Promise<AssignedEvent<T>[]> {
        return await this.stateManager.flush(this.id)
    }

    /** Retrieves the events from the bucket stateManager without deleting them */
    async get(): Promise<AssignedEvent<T>[]> {
        return await this.stateManager.flush(this.id)
    }

    async clear(): Promise<void> {
        await this.stateManager.clear(this.id)
    }

    /** close the bucket getting or flushing the stored events belonging to it.
     * Execute the passed callback to consume the events and destroy the bucket. */
    async close(watermark: number, mode: "flush" | "get", callback: (events: AssignedEvent<T>[]) => void, timestamp: number = Date.now()) {
        this.closedAt = timestamp
        
        setTimeout(async () => {
            const events = await this[mode]()
            this.destroy()
            callback(events)
            this.logger.info(`[bucket released] | id: ${this.logger.cyan(this.id)} - key: ${this.logger.cyan(events[0]?.eventKey) || "default"} - items: ${this.logger.yellow(events.length)}`)
        }, watermark)

        this.logger.info(`[bucket closed]   | id: ${this.logger.cyan(this.id)} - time: ${this.logger.cyan(this.closedAt)} - items: ${this.logger.yellow(this.eventCounter)}`)
    }

    /** Destroy = closed + watermarked */
    private destroy() {
        this.destroyedAt = Date.now()
    }
}