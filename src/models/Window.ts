import { Subscriber } from "rxjs";
import { Memory } from "../Storage";
import { Storage } from "./Storage";
import { Event, EventKey } from "../types/Event";
import { Duration, toMs } from "../types/Duration";
import { WinRxlogger } from "../utils/Logger"

type TimestampEtractor<T> = (value: T) => number
type KeyExtractor<T> = (value: T) => EventKey

export type WindowOptions<T> = {
    storage?: Storage<T>,
    watermark?: Duration,
    withEventTime?: TimestampEtractor<T>,
    withEventKey?: KeyExtractor<T>
}

export abstract class Window<T> {
    readonly storage: Storage<T>

    protected watermark: number
    protected timestampExtractor: TimestampEtractor<T> | null
    protected keyExtractor: KeyExtractor<T> | null

    isLooping: boolean = false

    logger = new WinRxlogger({
        toConsole: true
    })

    constructor(options: WindowOptions<T>) {
        this.watermark = options.watermark ? toMs(options.watermark) : 0
        this.storage = options.storage || new Memory()
        this.keyExtractor = options.withEventKey || null
        this.timestampExtractor = options.withEventTime || null
    }

    getEventTimestamp(value: T): number {
        return this.timestampExtractor ?
            this.timestampExtractor(value) :
            Date.now()
    }

    getEventKey(value: T): EventKey {
        return this.keyExtractor ?
            this.keyExtractor(value) :
            "default"
    }

    formatEvent(event: T): Event<T> {
        const eventKey = this.getEventKey(event)
        const eventTime = this.getEventTimestamp(event)

        this.logger.info("[enqueued event] :: key", this.logger.yellow(eventKey), "- timestamp", this.logger.yellow(eventTime))

        return {
            eventKey,
            eventTime,
            value: event
        }
    }

    release(subscriber: Subscriber<T[]>, events: Event<T>[]) {
        this.logger.info(`[window released] :: key: ${this.logger.yellow(events[0].eventKey)} - count: ${this.logger.yellow(events.length)}`)
        subscriber.next(events.map(e => e.value))
    }

    abstract onStart(subscriber: Subscriber<T[]>): Promise<void>
    abstract onDequeuedEvent(subscriber: Subscriber<T[]>, event: Event<T>): Promise<void>
    abstract onError(subscriber: Subscriber<T[]>): Promise<void>
    abstract onComplete(subscriber: Subscriber<T[]>): Promise<void>
}