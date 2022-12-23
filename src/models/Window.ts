import { Storage, StorageItemExta, StorageKey } from "./Storage";


export abstract class Window<T> {
    readonly _storage: Storage<T>

    constructor(storage: Storage<T>) {
        this._storage = storage
    }

    abstract open(key: StorageKey, callback: (items: ({ value: T, timestamp: number, extra: StorageItemExta })[]) => any): void
    abstract consume(key: StorageKey): { value: T, timestamp: number, extra: StorageItemExta }[]
    abstract consumeAll(): { value: T, timestamp: number, extra: StorageItemExta }[]
}