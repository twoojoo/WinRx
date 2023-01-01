import { Event } from "../models/Event"
import { Storage } from "../models/Storage"

export class Memory<T> extends Storage<T> {
    private memory: {[winId: string]: Event<T>[]} = {}

    constructor() {
        super()
    }

    async get(windowId: string): Promise<Event<T>[]> {
        return this.memory[windowId] || []
    }

    async push(item: Required<Event<T>>): Promise<void> {
        if (!this.memory[item.windowId]) this.memory[item.windowId] = []
        this.memory[item.windowId].push(item)
    }

    async flush(windowId: string): Promise<Event<T>[]> {
        const events = await this.get(windowId)
        this.memory[windowId] = []
        return events
    }
}