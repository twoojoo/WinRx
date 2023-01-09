import { randomUUID } from "crypto"

export type InnerEvent<T> = {
    streams: string[],
    ids: string[],
    value: T,
    ingestionTime: number
}

export function parseEvent<T>(streamName: string, event: T): InnerEvent<T> {
    return {
        streams: [streamName],
        ids: [randomUUID()],
        ingestionTime: Date.now(),
        value: event
    }
}

export function getEventValue<T>(event: InnerEvent<T>): T {
    return event.value
}