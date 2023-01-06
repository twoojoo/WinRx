import { Subscriber } from "rxjs";
import { Memory } from "../StateManager";
import { StateMananger } from "./StateManager";
import { IncomingEvent, EventKey, AssignedEvent, DequeuedEvent } from "../types/Event";
import { Duration, toMs } from "../types/Duration";
import { LoggerOptions, WinRxlogger } from "../utils/Logger"

type TimestampEtractor<T> = (value: T) => number
type KeyExtractor<T> = (value: T) => EventKey

export type WindowingOptions<T> = {
    stateManager?: StateMananger<T>,
    watermark?: Duration,
    withEventTime?: TimestampEtractor<T>,
    // withEventKey?: KeyExtractor<T>,
    logger?: LoggerOptions
}

export abstract class WindowingSystem<T> {
    readonly stateManager: StateMananger<T>
    readonly logger: WinRxlogger

    protected watermark: number
    protected timestampExtractor: TimestampEtractor<T> 
    protected keyExtractor: KeyExtractor<T> 

    isLooping: boolean = false

    constructor(options: WindowingOptions<T>) {
        this.watermark = toMs(options.watermark) > 1 ? toMs(options.watermark) : 1 //min 1 ms
        this.logger = new WinRxlogger(options.logger)
        this.stateManager = (options.stateManager || new Memory()).setlogger(this.logger)
        this.timestampExtractor = options.withEventTime
    }

    getEventTimestamp(value: T): number {
        return this.timestampExtractor ?
            this.timestampExtractor(value) :
            Date.now()
    }

    formatEvent(event: T): IncomingEvent<T> {
        const eventTime = this.getEventTimestamp(event)

        return {
            eventKey: "default",
            eventTime,
            value: event
        }
    }

    release(subscriber: Subscriber<T[]>, events: AssignedEvent<T>[]) {
        subscriber.next(events.map(e => e.value))
    }

    logWindowStart(kind: "session" | "tumbling" | "hopping") {
        this.logger.info(`[window started]  :: kind: ${this.logger.yellow(kind + " window")}`)
    }

    abstract onStart(subscriber: Subscriber<T[]>): Promise<void>
    abstract onDequeuedEvent(subscriber: Subscriber<T[]>, event: DequeuedEvent<T>): Promise<void>
}