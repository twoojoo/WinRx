import { AssignedEvent, DequeuedEvent, IncomingEvent } from "../types/Event"
import { WinRxlogger } from "../utils/Logger"

/** The Storage class handles both the queue (where events are put as soon as they reach
 * the window) and the window's buckets (where events are stored upon each bucket's release).*/
export abstract class StateMananger<T> {
    private logger: WinRxlogger

    setlogger(logger: WinRxlogger): StateMananger<T> {
        this.logger = logger
        return this
    }

    //queue methods
    abstract enqueue(event: IncomingEvent<T>): Promise<void>
    abstract dequeue(): Promise<DequeuedEvent<T>>
    abstract isQueueEmpty(): Promise<boolean>

    //buckets methods
    abstract push(event: AssignedEvent<T>): Promise<void>
    abstract flush(bucketId: string): Promise<AssignedEvent<T>[]>
    abstract get(bucketId: string): Promise<AssignedEvent<T>[]>
    abstract clear(bucketId: string): Promise<void>
}