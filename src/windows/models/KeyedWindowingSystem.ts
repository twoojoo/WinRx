import { StateMananger } from "./StateManager";
import { IncomingEvent, EventKey } from "../types/Event";
import { WinRxlogger } from "../utils/Logger"
import { WindowingOptions, WindowingSystem } from "./WindowingSystem";

type TimestampEtractor<E> = (value: E) => number
type KeyExtractor<E> = (value: E) => EventKey

export type KeyedWindowingOptions<T> = WindowingOptions<T> & {
    withEventKey?: KeyExtractor<T>
}

export abstract class KeyedWindowingSystem<E> extends WindowingSystem<E>{
    readonly stateManager: StateMananger<E>
    readonly logger: WinRxlogger

    protected watermark: number
    protected timestampExtractor: TimestampEtractor<E> | null
    protected keyExtractor: KeyExtractor<E> | null

    isLooping: boolean = false

    constructor(options: KeyedWindowingOptions<E>) {
        super(options)
        this.keyExtractor = options.withEventKey || null
    }

    getEventKey(value: E): EventKey {
        return this.keyExtractor ?
            this.keyExtractor(value) :
            "default"
    }

    formatEvent(event: E): IncomingEvent<E> {
        const eventKey = this.getEventKey(event)
        const eventTime = this.getEventTimestamp(event)

        return {
            eventKey,
            eventTime,
            value: event
        }
    }
}