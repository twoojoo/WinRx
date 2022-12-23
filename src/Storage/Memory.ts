import { Storage, StorageItemExta, StorageKey } from "../models/Storage"

export class Memory<T> extends Storage<T> {
    private _memory: { [key: StorageKey]: { value: T, timestamp: number, extra: StorageItemExta }[] } = {}

    constructor() {
        super()
    }

    storeItem(key: StorageKey, item: { value: T; timestamp: number; extra: StorageItemExta; }): void {
        if (!this._memory[key]) this._memory[key] = []
        this._memory[key].push(item)
    }

    retrieveItems(key: StorageKey): { value: T; timestamp: number; extra: StorageItemExta }[] {
        return this._memory[key] || []
    }

    clear(key: StorageKey): void {
        this._memory[key] = []
    }

    isEmpty(key: StorageKey): boolean {
        if (!this._memory[key]) return true
        else if (this._memory[key].length == 0) return true
        else return false
    }
}