import { Storage } from "../models/Storage"
import { default as RedisClient } from "ioredis"
import { Event, EventKey } from "../types/Event"

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
        const bucketId = event.bucketId

        if (!this.counters[bucketId]) this.counters[bucketId] = 0
        this.counters[bucketId]++

        const key = `winrx-${bucketId}-${this.counters[bucketId]}`
        await this.redisClient.set(key, JSON.stringify(event))
    }

    async get(bucketId: string): Promise<Event<T>[]> {
        return await this.getOrFlush(bucketId, "get")
    }

    async flush(bucketId: string): Promise<Event<T>[]> {
        return await this.getOrFlush(bucketId, "flush")
    }

    async clear(bucketId: string) {
        const keys = await this.redisClient.keys(`winxr-${bucketId}*`)
        for (let key in keys) await this.redisClient.del(key)
    }

    private async getOrFlush(bucketId: string, action: "get" | "flush") {
        const events: Event<T>[] = []

        for (let i = 1; i <= this.counters[bucketId]; i++) {
            const key = `winrx-${bucketId}-${this.counters[bucketId]}`

            const event = JSON.parse(await this.redisClient.get(key))
            if (event) events.push(event)
        }

        if (action == "flush") await this.clear(bucketId)

        return events
    }
}