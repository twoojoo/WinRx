import { Observer } from "rxjs";
import { ItemToStore, Storage, StorageKey } from "./Storage";

export type WindowOptions<T> = {
    storage: Storage<T>,
    closeOnError?: boolean,
    closeOnComplete?: boolean
}

export abstract class Window<T> {
    readonly _storage: Storage<T>
    readonly _closeOnError: boolean
    readonly _closeOnComplete: boolean

    constructor(options: WindowOptions<T>) {
        this._storage = options.storage
        this._closeOnError = options.closeOnError || false
        this._closeOnComplete = options.closeOnComplete || false
    }

    abstract onStart(observer: Observer<T[]>): void
    abstract onItem(observer: Observer<T[]>, item: ItemToStore<T>): void
    abstract consume(observer: Observer<T[]>): void
}

//callback: (items: ({ value: T, timestamp: number, extra: StorageItemExta })[]