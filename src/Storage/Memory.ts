import { Storage, StorageKey, StorageItem } from "../models/Storage"

export class Memory<T> extends Storage<T> {
    private _memory: StorageItem<T>[] = []

    constructor() {
        super()
    }

    retrieveKeys(): StorageKey[] {
        return Object.keys(this._memory)
    }

    storeItem(item: StorageItem<T>): void {
        this._memory.push(item)
    }

    retrieveByKey(key: StorageKey): StorageItem<T>[] {
        return this._memory.filter(i => i.key == key)
    }

    retrieveAll(): StorageItem<T>[] {
        return this._memory
    }

    retrieveByTimestamp(filter: (timestap: number) => boolean): StorageItem<T>[] {
        return this._memory.filter(i => filter(i.timestamp))
    }

    clearByKey(key: StorageKey): void {
        this._memory = this._memory.filter(i => i.key != key)
    }
    
    clearByTimeStamp(filter: (timestap: number) => boolean): void {
        console.log("before delete:", this._memory.length)
        this._memory = this._memory.filter(i => !filter(i.timestamp))
        console.log("after delete:", this._memory.length)
    }

    clearAll(): void {
        this._memory = []
    }

    isEmptyByKey(key: StorageKey): boolean {
        return this._memory.filter(i => i.key == key).length == 0
    }

    isEmptyAll(): boolean {
        return this._memory.length == 0
    }
}