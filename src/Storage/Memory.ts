import { Storage, StorageKey, StorageItem } from "../models/Storage"

export class Memory<T> extends Storage<T> {
    private _memory: StorageItem<T>[] = []

    constructor() {
        super()
    }

    async retrieveKeys(): Promise<StorageKey[]> {
        return Object.keys(this._memory)
    }

    async storeItem(item: StorageItem<T>): Promise<void> {
        this._memory.push(item)
    }

    async retrieveByKey(key: StorageKey): Promise<StorageItem<T>[]> {
        return this._memory.filter(i => i.key == key)
    }

    async retrieveAll(): Promise<StorageItem<T>[]> {
        return this._memory
    }

    async retrieveByTimestamp(filter: (timestap: number) => boolean): Promise<StorageItem<T>[]> {
        return this._memory.filter(i => filter(i.timestamp))
    }

    async retrieveByKeyAndTimestamp(key: StorageKey, filter: (timestap: number) => boolean): Promise<StorageItem<T>[]> {
        return this._memory.filter(i => i.key == key && filter(i.timestamp))
    }

    async clearByKey(key: StorageKey): Promise<void> {
        this._memory = this._memory.filter(i => i.key != key)
    }
    
    async clearByTimeStamp(filter: (timestap: number) => boolean): Promise<void> {
        this._memory = this._memory.filter(i => !filter(i.timestamp))
    }

    async clearByKeyAndTimeStamp(key: StorageKey, filter: (timestap: number) => boolean): Promise<void> {
        this._memory = this._memory.filter(i => i.key != key && !filter(i.timestamp))
    }

    async clearAll(): Promise<void> {
        this._memory = []
    }

    async isEmptyByKey(key: StorageKey): Promise<boolean> {
        return this._memory.filter(i => i.key == key).length == 0
    }

    async isEmptyAll(): Promise<boolean> {
        return this._memory.length == 0
    }
}