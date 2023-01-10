import { IncomingEvent, EventKey, AssignedEvent, DequeuedEvent } from "../types/Event";
import { LoggerOptions, WinRxlogger } from "../utils/Logger"
import { Duration, toMs } from "../types/Duration";
import { StateMananger } from "./StateManager";
import { Memory } from "../stateManagers";
import { Subscriber } from "rxjs";

type TimestampEtractor<T> = (value: T) => number
type KeyExtractor<T> = (value: T) => EventKey

export type WindowingOptions<T> = {
    id?: string | number
    stateManager?: StateMananger<any>,
    watermark?: Duration,
    withEventTime?: TimestampEtractor<T>,
    logger?: LoggerOptions
}

export abstract class WindowingSystem<T> {
    readonly id: string | number
    readonly stateManager: StateMananger<T>
    readonly logger: WinRxlogger

    protected watermark: number
    protected timestampExtractor: TimestampEtractor<T> 
    protected keyExtractor: KeyExtractor<T> 

    isLooping: boolean = false

    constructor(options: WindowingOptions<T>) {
        this.watermark = toMs(options.watermark) > 1 ? toMs(options.watermark) : 1 //min 1 ms
        this.stateManager = (options.stateManager || new Memory()).setlogger(this.logger)
        this.timestampExtractor = options.withEventTime
        this.id = options.id || "0"
        this.logger = new WinRxlogger(options.logger, this.id)
    }

    getEventTimestamp(value: T): number {
        return this.timestampExtractor ?
            this.timestampExtractor(value) :
            Date.now()
    }

    formatEvent(event: T): IncomingEvent<T> {
        return {
            eventKey: "default",
            eventTime: this.getEventTimestamp(event),
            value: event
        }
    }

    release(subscriber: Subscriber<T[]>, events: AssignedEvent<T>[]) {
        subscriber.next(events.map(e => e.value))
    }

    logWindowStart(kind: "session" | "tumbling" | "hopping" | "sliding" | "counting") {
        this.logger.printHeader()
        this.logger.info(`[window started]  | kind: ${this.logger.cyan(kind + " window")}`)
    }

    abstract onStart(subscriber: Subscriber<T[]>): Promise<void>
    abstract onDequeuedEvent(subscriber: Subscriber<T[]>, event: DequeuedEvent<T>): Promise<void>
}