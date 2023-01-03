export type EventKey = string | number

export type Event<T> = {
    value: T,
    eventKey: EventKey,
    eventTime: number,
    processingTime: number,
    bucketId?: string
}