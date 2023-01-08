import { AssignedEvent, DequeuedEvent, IncomingEvent } from "../Types/Event"
import { StateMananger } from "../Models/StateManager"

export class Memory<T> extends StateMananger<T> {
    private queue: IncomingEvent<T>[] = []
    private memory: {[winId: string]: AssignedEvent<T>[]} = {}

    constructor() {
        super()
    }

    async enqueue(event: IncomingEvent<T>): Promise<void> {
        this.queue.push(event)   
    }

    async dequeue(): Promise<DequeuedEvent<T>> {
        const event = this.queue.shift()
        return {...event, processingTime: Date.now()}
    }

    async isQueueEmpty(): Promise<boolean> {
        return this.queue.length == 0
    }

    async get(bucketId: string): Promise<AssignedEvent<T>[]> {
        return this.memory[bucketId] || []
    }

    async push(item: AssignedEvent<T>): Promise<void> {
        if (!this.memory[item.bucketId]) this.memory[item.bucketId] = []
        this.memory[item.bucketId].push(item)
    }

    async flush(bucketId: string): Promise<AssignedEvent<T>[]> {
        const events = await this.get(bucketId)
        await this.clear(bucketId)
        return events
    }

    async clear(bucketId: string): Promise<void> {
        this.memory[bucketId] = []
    }
}