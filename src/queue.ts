import { QueueManager } from "./Models/QueueManager"

export class Queue<T> {
    isLooping: boolean = false
    queueManager: QueueManager<T>

    constructor(queueManager: QueueManager<T>) {
        this.queueManager = queueManager
    }

    async enqueue(event: T) {
        await this.queueManager.enqueue(event)
    }

    async dequeueLoop(callback: (event: T) => void) {
        if (this.isLooping) return
        this.isLooping = true

        while (!(await this.isEmpty())) {
            const event = await this.queueManager.dequeue()
            callback(event)
        }

        this.isLooping = false
    }

    private async isEmpty(): Promise<boolean> {
        return await this.queueManager.isQueueEmpty()
    }
}