// import { randomUUID } from "crypto"
// import { AssignedEvent, DequeuedEvent, IncomingEvent } from "../types/Event"
// import { WinRxlogger } from "../utils/Logger"
import { MetaEvent } from "../event"
import { StateManager } from "../state/state-manager"
import { StreamContext } from "../stream"

/** A Bucket is a collection of events. It doesn't handle intervals and timeouts,
 * which are instead handled by the windowing system that created the bucket. But it 
 * can tells if an event belongs to him by comparing the event/processing time with
 * the his opening and closing timestamps. */
export class Bucket<E> {
    readonly id: string
    readonly openedAt: number

    private windowName: string

    private stateManager: StateManager<E>
    private closedAt: number | undefined = undefined
    private destroyedAt: number | undefined = undefined

    // private eventCounter = 0

    constructor(ctx: StreamContext, windowName: string, timestamp: number = Date.now()) {
        this.windowName = windowName
        this.openedAt = timestamp
        this.stateManager = ctx.stateManager
        this.id = "__" + timestamp.toString()
    }

    private getTimeFromEvent(event: MetaEvent<E>) {
        return event.tracking.eventTime || event.tracking.windows[this.windowName].ingestionTime || event.tracking.ingestionTime
    }

    /** Determin if the bucket is closed and watermarked */
    isDestroyed(): boolean {
        return !!this.destroyedAt
    }

    /** Determin if the bucket is closed, but non necessarily watermarked */
    isClosed(): boolean {
        return !!this.closedAt
    }

    isAfterEvent(event: MetaEvent<E>) {
        const eTime = this.getTimeFromEvent(event)
        return this.openedAt > eTime
    }

    /** Determin if the event belongs to this bucket by comparing the event time with 
     * the opening timestamp (and closing timestamp, if already closed) of the bucket.
     * Always return false is the bucket is already destroyed (aka watermarked). */
    ownsEvent(event: MetaEvent<E>): boolean {
        if (this.isDestroyed()) return false
        const eTime = this.getTimeFromEvent(event)
        if (this.isClosed()) return eTime >= this.openedAt && eTime < this.closedAt
        else return eTime >= this.openedAt
    }

    /** Insert a new event in the bucket stateManager */
    async push(event: MetaEvent<E>): Promise<void> {
        // this.eventCounter++
        event.tracking.windows[this.windowName].bucketId = this.id
        await this.stateManager.push(this.windowName, event)
    }

    /** Retrieves the events from the bucket stateManager and clear them */
    async flush(): Promise<MetaEvent<E>[]> {
        return await this.stateManager.flush(this.windowName, this.id)
    }

    /** Retrieves the events from the bucket stateManager without deleting them */
    // async get(): Promise<AssignedEvent<T>[]> {
    //     return await this.stateManager.flush(this.id)
    // }

    // async clear(): Promise<void> {
    //     await this.stateManager.clear(this.id)
    // }

    /** close the bucket getting or flushing the stored events belonging to it.
     * Execute the passed callback to consume the events and destroy the bucket. */
    async close(watermark: number, mode: "flush" | "get", callback: (events: MetaEvent<E>[]) => void, timestamp: number = Date.now()) {
        this.closedAt = timestamp
        
        setTimeout(async () => {
            const events = await this[mode]()
            this.destroy()
            callback(events)
        }, watermark)
    }

    /** Destroy = closed + watermarked */
    private destroy() {
        this.destroyedAt = Date.now()
    }
}