import { Storage, StorageKey, StorageItem } from "../models/Storage"
import { default as RedisClient } from "ioredis"

export class Redis<T> extends Storage<T> {
    private _redisClient: RedisClient
    private _keys: { [key: StorageKey]: number } = {}
    private _TTL: number | undefined

    constructor(client: RedisClient, TTLms?: number) {
        super()
        this._redisClient = client
        this._TTL = TTLms || undefined
    }

    async retrieveKeys(): Promise<StorageKey[]> {
        return Object.keys(this._keys)
    }

    async storeItem(item: StorageItem<T>): Promise<void> {
        const key = item.key

        if (!this._keys[key]) this._keys[key] = 1
        else this._keys[key]++

        if (this._TTL) await this._redisClient.set(`winrx-${key}-${this._keys[key]}`, JSON.stringify(item), "PX", this._TTL)
        else await this._redisClient.set(`winrx-${key}-${this._keys[key]}`, JSON.stringify(item))
    }

    async retrieveByKey(key: StorageKey): Promise<StorageItem<T>[]> {
        if (!this._keys[key]) return []

        let items: StorageItem<T>[] = []
        for (let i = 0; i < this._keys[key]; i++) {
            const item = await this.retrieveItem(key, i)
            if (item) items.push(item)
        }
        return items
    }

    async retrieveAll(): Promise<StorageItem<T>[]> {
        let items: StorageItem<T>[] = []
        for (let key of Object.keys(this._keys)) {
            const keyItems = await this.retrieveByKey(key)
            items = items.concat(keyItems)
        }
        return items
    }

    async retrieveByTimestamp(filter: (timestap: number) => boolean): Promise<StorageItem<T>[]> {
        let items: StorageItem<T>[] = []
        for (let key of Object.keys(this._keys)) {
            const keyItems = await this.retrieveByKey(key)
            items = items.concat(keyItems.filter(i => filter(i.timestamp)))
        }
        return items
    }

    async retrieveByKeyAndTimestamp(key: StorageKey, filter: (timestap: number) => boolean): Promise<StorageItem<T>[]> {
        const keyItems = await this.retrieveByKey(key)
        return keyItems.filter(i => filter(i.timestamp))
    }

    async clearByKey(key: StorageKey): Promise<void> {
        for (let i = 0; i < this._keys[key]; i++) {
            await this.deleteItem(key, i)
        }
    }

    async clearByTimeStamp(filter: (timestap: number) => boolean): Promise<void> {
        for (let key of Object.keys(this._keys)) {
            for (let i = 0; i < this._keys[key]; i++) {
                await this.deleteItem(key, i, filter)
            }
        }
    }

    async clearByKeyAndTimeStamp(key: StorageKey, filter: (timestap: number) => boolean): Promise<void> {
        for (let i = 0; i < this._keys[key]; i++) {
            await this.deleteItem(key, i, filter)
        }
    }

    async clearAll(): Promise<void> {
        for (let key of Object.keys(this._keys)) {
            await this.clearByKey(key)
        }

        this._keys = {}
    }

    async isEmptyByKey(key: StorageKey): Promise<boolean> {
        return this._keys[key] == 0
    }

    async isEmptyAll(): Promise<boolean> {
        for (let [key, count] of Object.entries(this._keys)) {
            if (count > 0) return false
        }
        return true
    }

    private async retrieveItem(key: StorageKey, index: number, tsFilter?: (timestamp: number) => boolean) {
        let item = await this._redisClient.get(`winrx-${key}-${index}`)
        if (item) {
            let items = [JSON.parse(item)]
            if (tsFilter) items = items.filter(i => tsFilter(i.timestamp))
            if (item[0]) return items[0]
        }
    }

    private async deleteItem(key: StorageKey, index: number, tsFilter?: (timestamp: number) => boolean) {
        const redisKey = `winrx-${key}-${index}`
        let item = await this._redisClient.get(redisKey)
        if (item) {
            let items = [JSON.parse(item)]
            if (tsFilter) items = items.filter(i => tsFilter(i.timestamp))
            if (item[0]) {
                await this._redisClient.del(redisKey)
                this._keys[key]--
                if (this._keys[key] < 0) throw Error("counter should be >= 0")
            }
        }
    }
}