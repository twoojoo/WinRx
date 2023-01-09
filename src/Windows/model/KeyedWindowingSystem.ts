import { Subscriber } from "rxjs";
import { Memory } from "../../StateManagers";
import { StateMananger } from "../../Models/StateManager";
import { IncomingEvent, EventKey, AssignedEvent, DequeuedEvent } from "../../Types/Event";
import { Duration, toMs } from "../../Types/Duration";
import { LoggerOptions, WinRxlogger } from "../../Utils/Logger"
import { WindowingOptions, WindowingSystem } from "./WindowingSystem";
import { InnerEvent } from "../../event";

type KeyExtractor<T> = (value: T) => EventKey

export type KeyedWindowingOptions<R> = WindowingOptions<R> & {
    withEventKey?: KeyExtractor<R>
}

export abstract class KeyedWindowingSystem<T extends InnerEvent<R>, R> extends WindowingSystem<T, R>{
    readonly logger: WinRxlogger

    protected watermark: number
    protected keyExtractor: KeyExtractor<R> 

    isLooping: boolean = false

    constructor(options: KeyedWindowingOptions<R>) {
        super(options)
        this.keyExtractor = options.withEventKey
    }

    getEventKey(event: T): EventKey {
        return this.keyExtractor ?
            this.keyExtractor(event.value) :
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