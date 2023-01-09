import { DequeuedEvent, IncomingEvent } from "../Types/Event"

export abstract class QueueManager<T> {
    protected streamName: string

    setStreamName(name: string) {
        this.streamName = name
    }

    //queue methods
    abstract enqueue(event: T): Promise<void>
    abstract dequeue(): Promise<T>
    // abstract flush():
    abstract isQueueEmpty(): Promise<boolean>
}