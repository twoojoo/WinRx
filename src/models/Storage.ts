import { Event, EventKey } from "../types/Event"

export abstract class Storage<T> {
    abstract enqueue(event: Event<T>): Promise<void>
    abstract dequeue(): Promise<Event<T>>
    abstract isQueueEmpty(): Promise<boolean>

    abstract push(event: Required<Event<T>>): Promise<void>
    abstract flush(bucketId: string): Promise<Event<T>[]>
    abstract get(bucketId: string): Promise<Event<T>[]>
    abstract clear(bucketId: string): Promise<void>
}