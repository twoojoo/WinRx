import { IncomingEvent, EventKey, AssignedEvent, DequeuedEvent } from "../types/Event";
import { LoggerOptions, WinRxlogger } from "../utils/Logger"
import { Duration, toMs } from "../types/Duration";
import { StateMananger } from "./StateManager";
import { Memory } from "../stateManagers";
import { Subject } from "rxjs";
import { MetaEvent } from "../../event";

type TimestampEtractor<E> = (value: E) => number
type KeyExtractor<E> = (value: E) => EventKey

export type WindowingOptions<E> = {
    id?: string | number
    stateManager?: StateMananger<any>,
    watermark?: Duration,
    withEventTime?: TimestampEtractor<E>,
    logger?: LoggerOptions
}

export abstract class WindowingSystem<E> {
    readonly id: string | number
    readonly stateManager: StateMananger<E>
    readonly logger: WinRxlogger

    protected watermark: number
    protected timestampExtractor: TimestampEtractor<E> 
    protected keyExtractor: KeyExtractor<E> 

    isLooping: boolean = false

    constructor(options: WindowingOptions<E>) {
        this.watermark = toMs(options.watermark) > 1 ? toMs(options.watermark) : 1 //min 1 ms
        this.stateManager = (options.stateManager || new Memory()).setlogger(this.logger)
        this.timestampExtractor = options.withEventTime
        this.id = options.id || "0"
        this.logger = new WinRxlogger(options.logger, this.id)
    }

    getEventTimestamp(value: E): number {
        return this.timestampExtractor ?
            this.timestampExtractor(value) :
            Date.now()
    }

    formatEvent(event: E): IncomingEvent<E> {
        return {
            eventKey: "default",
            eventTime: this.getEventTimestamp(event),
            value: event
        }
    }

    release(subject: Subject<MetaEvent<E>[]>, events: AssignedEvent<MetaEvent<E>>[]) {
        subject.next(events.map(e => e.value))
    }

    logWindowStart(kind: "session" | "tumbling" | "hopping" | "sliding" | "counting") {
        this.logger.printHeader()
        this.logger.info(`[window started]  | kind: ${this.logger.cyan(kind + " window")}`)
    }

    abstract onStart(subject: Subject<MetaEvent<E>[]>): Promise<void>
    abstract onDequeuedEvent(subject: Subject<MetaEvent<E>[]>, event: DequeuedEvent<MetaEvent<E>>): Promise<void>
}