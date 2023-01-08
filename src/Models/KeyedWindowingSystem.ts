import { Subscriber } from "rxjs";
import { Memory } from "../StateManagers";
import { StateMananger } from "./StateManager";
import { IncomingEvent, EventKey, AssignedEvent, DequeuedEvent } from "../Types/Event";
import { Duration, toMs } from "../Types/Duration";
import { LoggerOptions, WinRxlogger } from "../Utils/Logger"
import { WindowingOptions, WindowingSystem } from "./WindowingSystem";

type TimestampEtractor<T> = (value: T) => number
type KeyExtractor<T> = (value: T) => EventKey

export type KeyedWindowingOptions<T> = WindowingOptions<T> & {
    withEventKey?: KeyExtractor<T>
}

export abstract class KeyedWindowingSystem<T> extends WindowingSystem<T>{
    readonly stateManager: StateMananger<T>
    readonly logger: WinRxlogger

    protected watermark: number
    protected timestampExtractor: TimestampEtractor<T> | null
    protected keyExtractor: KeyExtractor<T> | null

    isLooping: boolean = false

    constructor(options: KeyedWindowingOptions<T>) {
        super(options)
        this.keyExtractor = options.withEventKey || null
    }

    getEventKey(value: T): EventKey {
        return this.keyExtractor ?
            this.keyExtractor(value) :
            "default"
    }

    formatEvent(event: T): IncomingEvent<T> {
        const eventKey = this.getEventKey(event)
        const eventTime = this.getEventTimestamp(event)

        return {
            eventKey,
            eventTime,
            value: event
        }
    }
}