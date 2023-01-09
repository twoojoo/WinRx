import {QueueManager} from "../Models/QueueManager"

export class Memory<T> extends QueueManager<T> {
    private queue: T[] = []

    constructor() {
        super()
    }

    async enqueue(event: T): Promise<void> {
        this.queue.push(event) 
    }

    async dequeue(): Promise<T> {
        return this.queue.shift()
    }

    async isQueueEmpty(): Promise<boolean> {
        return this.queue.length == 0
    }
}