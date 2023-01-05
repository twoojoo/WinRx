export type EventKey = string | number

export type IncomingEvent<T> = {
    value: T,
    eventKey: EventKey,
    eventTime: number,
}

export type DequeuedEvent<T> = IncomingEvent<T> & { processingTime: number }

export type AssignedEvent<T> = DequeuedEvent<T> & { bucketId: number }