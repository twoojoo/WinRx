import { Subscriber } from "rxjs";
import { Memory } from "../Storage";
import { Storage } from "./Storage";
import { Event, EventKey } from "../types/Event";
import { Duration, toMs } from "../types/Duration";

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

    abstract onStart(subscriber: Subscriber<T[]>): Promise<void>
    abstract onEvent(subscriber: Subscriber<T[]>, event: Event<T>): Promise<void>
    abstract onError(subscriber: Subscriber<T[]>): Promise<void>
    abstract onComplete(subscriber: Subscriber<T[]>): Promise<void>

    release(subscriber: Subscriber<T[]>, events: Event<T>[]) {
        subscriber.next(events.map(e => e.value))
    }
}