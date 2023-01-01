import { Storage } from "../models/Storage"
import { default as RedisClient } from "ioredis"
import { Event, EventKey } from "../models/Event"

export class Redis<T> extends Storage<T> {
    private redisClient: RedisClient
    private counters: { [winId: string]: number } = {}
    private TTL: number | undefined

    constructor(client: RedisClient, TTLms?: number) {
        super()
        this.redisClient = client
        this.TTL = TTLms || undefined
    }

    async push(event: Required<Event<T>>): Promise<void> {
        const winId = event.windowId

        if (!this.counters[winId]) this.counters[winId] = 0
        this.counters[winId]++

        const key = `${winId}-${this.counters[winId]}`
        await this.redisClient.set(key, JSON.stringify(event))
    }

    async get(windowId: string): Promise<Event<T>[]> {
        return await this.getOrFlush(windowId, "get")
    }

    async flush(windowId: string): Promise<Event<T>[]> {
        return await this.getOrFlush(windowId, "flush")
    }

    private async getOrFlush(windowId: string, action: "get" | "flush") {
        const events: Event<T>[] = []

        for (let i = 1; i <= this.counters[windowId]; i++) {
            const key = `${windowId}-${this.counters[windowId]}`

            const event = JSON.parse(await this.redisClient.get(key))
            if (event) events.push(event)
        }

        if (action == "flush") {
            const keys = await this.redisClient.keys(`${windowId}*`)
            for(let key in keys) await this.redisClient.del(key)
        }

        return events
    }
}