import { StateMananger } from "../models/StateManager"
import { default as RedisClient } from "ioredis"
import { AssignedEvent, DequeuedEvent, IncomingEvent } from "../types/Event"
import { randomUUID } from "crypto"

export class Redis<T> extends StateMananger<T> {
    private redisClient: RedisClient
    private counters: { [winId: string]: number } = {}
    private queueKey: string

    constructor(client: RedisClient) {
        super()
        this.redisClient = client
        this.queueKey = "winrx-queue-" + randomUUID()
    }

    async enqueue(event: IncomingEvent<T>): Promise<void> {
        await this.redisClient.xadd(this.queueKey, '*', "message", JSON.stringify(event))
    }

    async dequeue(): Promise<DequeuedEvent<T>> {
        const value = await this.redisClient.xread("COUNT", 1, "STREAMS", this.queueKey, "0")
        const redisId = value[0][1][0][0]
        const event: DequeuedEvent<T> = JSON.parse(value[0][1][0][1][1])
        await this.redisClient.xdel(this.queueKey, redisId)
        event.processingTime = Date.now()
        return event
    }

    async isQueueEmpty(): Promise<boolean> {
        try {
            const info: any[] = (await this.redisClient.xinfo("STREAM", this.queueKey) as any[])
            const length = info[info.indexOf("length") + 1]
            return length == 0
        } catch (err) {
            if (err.message == "ERR no such key") return true
            else throw err
        }
    }

    async push(event: AssignedEvent<T>): Promise<void> {
        const bucketId = event.bucketId

        if (!this.counters[bucketId]) this.counters[bucketId] = 0
        this.counters[bucketId]++

        const key = `winrx-${bucketId}-${this.counters[bucketId]}`
        await this.redisClient.set(key, JSON.stringify(event))
    }

    async get(bucketId: string): Promise<AssignedEvent<T>[]> {
        return await this.getOrFlush(bucketId, "get")
    }

    async flush(bucketId: string): Promise<AssignedEvent<T>[]> {
        return await this.getOrFlush(bucketId, "flush")
    }

    async clear(bucketId: string) {
        const keys = await this.redisClient.keys(`winxr-${bucketId}*`)
        for (let key in keys) await this.redisClient.del(key)
    }

    private async getOrFlush(bucketId: string, action: "get" | "flush") {
        const events: AssignedEvent<T>[] = []
        for (let i = 1; i <= this.counters[bucketId]; i++) {
            const key = `winrx-${bucketId}-${i}`

            const event = JSON.parse(await this.redisClient.get(key))
            if (event) events.push(event)
        }

        if (action == "flush") await this.clear(bucketId)
        
        return events
    }
}