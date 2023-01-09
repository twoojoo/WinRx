import { IncomingEvent, AssignedEvent, DequeuedEvent } from "../../Types/Event";
import { Duration, toMs } from "../../Types/Duration";
import { StateMananger } from "../../Models/StateManager";
import { Memory } from "../../StateManagers";
import { Subject } from "rxjs";
import { InnerEvent } from "../../event";

type TimestampEtractor<T> = (value: T) => number

export type WindowingOptions<R> = {
    id?: string | number
    watermark?: Duration,
    withEventTime?: TimestampEtractor<R>
}

export abstract class WindowingSystem<T extends InnerEvent<R>, R> {
    readonly id: string | number
    readonly stateManager: StateMananger<T>

    protected watermark: number
    protected timestampExtractor: TimestampEtractor<R>

    isLooping: boolean = false

    constructor(options: WindowingOptions<R>) {
        this.watermark = toMs(options.watermark) > 1 ? toMs(options.watermark) : 1 //min 1 ms
        this.stateManager = new Memory()
        this.timestampExtractor = options.withEventTime
        this.id = options.id || "0"
    }

    getEventTimestamp(event: T): number {
        return this.timestampExtractor ?
            this.timestampExtractor(event.value) :
            Date.now()
    }

    formatEvent(event: T): IncomingEvent<T> {
        return {
            eventKey: "default",
            eventTime: this.getEventTimestamp(event),
            value: event
        }
    }

    release(sub: Subject<InnerEvent<R[]>>, events: AssignedEvent<T>[]) {
        sub.next(mergeEvents(events))
    }

    abstract onStart(sub: Subject<InnerEvent<R[]>>): Promise<void>
    abstract onDequeuedEvent(sub: Subject<InnerEvent<R[]>>, event: DequeuedEvent<T>): Promise<void>
}

function mergeEvents<T>(events: AssignedEvent<InnerEvent<T>>[]): InnerEvent<T[]> {
    const merged: InnerEvent<T[]> = {
        ids: [],
        streams: [],
        ingestionTime: events[0].value.ingestionTime,
        value: []
    }

    events.forEach(e => {
        merged.ids.push(...e.value.ids)
        merged.streams.push(...e.value.streams)
        merged.value.push(e.value.value)
    })

    return merged
}