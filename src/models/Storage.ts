import { Event } from "../types/Event"

/** The Storage class handles both the queue (where events are put as soon as they reach
 * the window) and the window's buckets (where events are stored upon each bucket's release).*/
export abstract class Storage<T> {
    //queue methods
    abstract enqueue(event: Event<T>): Promise<void>
    abstract dequeue(): Promise<Event<T>>
    abstract isQueueEmpty(): Promise<boolean>

    //buckets methods
    abstract push(event: Required<Event<T>>): Promise<void>
    abstract flush(bucketId: string): Promise<Event<T>[]>
    abstract get(bucketId: string): Promise<Event<T>[]>
    abstract clear(bucketId: string): Promise<void>
}