import { Event } from "../types/Event"
import { Storage } from "../models/Storage"

export class Memory<T> extends Storage<T> {
    private memory: {[winId: string]: Event<T>[]} = {}

    constructor() {
        super()
    }

    async get(bucketId: string): Promise<Event<T>[]> {
        return this.memory[bucketId] || []
    }

    async push(item: Required<Event<T>>): Promise<void> {
        if (!this.memory[item.bucketId]) this.memory[item.bucketId] = []
        this.memory[item.bucketId].push(item)
    }

    async flush(bucketId: string): Promise<Event<T>[]> {
        const events = await this.get(bucketId)
        await this.clear(bucketId)
        return events
    }

    async clear(bucketId: string): Promise<void> {
        this.memory[bucketId] = []
    }
}