import { Storage, StorageKey, StorageStructureByKey, StorageStructureByAction, ItemToStore } from "../models/Storage"

export class Memory<T> extends Storage<T> {
    private _memory: StorageStructureByKey<T> = {}

    constructor() {
        super()
    }

    storeItem(item: ItemToStore<T>): void {
        const {key, timestamp, value, action} = item
        if (!this._memory[key]) this._memory[key] = {}
        if (!this._memory[key][action]) this._memory[key][action] = {}
        if (!this._memory[key][action][timestamp]) this._memory[key][action][timestamp] = []
        this._memory[key][action][timestamp].push(value)
    }

    retrieveByKey(key: StorageKey): StorageStructureByAction<T> {
        return this._memory[key]
    }

    retrieveAll(): StorageStructureByKey<T> {
        return this._memory
    }

    clearByKey(key: StorageKey): void {
        this._memory[key] = {}
    }

    clearAll(): void {
        this._memory = {}
    }

    isEmptyByKey(key: StorageKey): boolean {
        if (!this._memory[key]) return true
        else return false
    }

    isEmptyAll(): boolean {
        const keys = Object.keys(this._memory)

        const notEmpty = keys.filter(k => {
            if (!this._memory[k]) return false 
            else return JSON.stringify(this._memory[k]) == "{}"
        })

        return notEmpty.length == 0
    }
}