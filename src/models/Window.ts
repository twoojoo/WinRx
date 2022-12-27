import { Subscriber } from "rxjs";
import { Memory } from "../Storage";
import { StorageItem, Storage, StorageKey } from "./Storage";
import { randomUUID } from "crypto"

type TimestampEtractor<T> = (value: T) => number
type KeyExtractor<T> = (value: T) => StorageKey

export type WindowOptions<T> = {
    storage?: Storage<T>,
    closeOnError?: boolean,
    closeOnComplete?: boolean
    timestampFrom?: TimestampEtractor<T>,
    keyFrom?: KeyExtractor<T>
    // persistData?: boolean
}

export abstract class Window<T> {
    readonly _windowId: string

    readonly _storage: Storage<T>

    readonly _closeOnError: boolean
    readonly _closeOnComplete: boolean

    protected _timestampFrom: TimestampEtractor<T> | null
    protected _keyFrom: KeyExtractor<T> | null
    // readonly _persistData: boolean

    constructor(options: WindowOptions<T>) {
        this._windowId = randomUUID()

        this._storage = options.storage || new Memory()

        this._closeOnError = options.closeOnError || true
        this._closeOnComplete = options.closeOnComplete || true

        this._keyFrom = options.keyFrom || null
        this._timestampFrom = options.timestampFrom || null
        // this._persistData = options.persistData || false
    }

    getEventTimestamp(value: T): number {
        return this._timestampFrom ?
        this._timestampFrom(value) :
        Date.now()
    }
    
    getEventKey(value: T): StorageKey {
        return this._keyFrom ?
            this._keyFrom(value) :
            "default"
    }

    abstract onStart(subscriber: Subscriber<T[]>): Promise<void>
    abstract onItem(subscriber: Subscriber<T[]>, item: StorageItem<T>): Promise<void>
    abstract release(subscriber: Subscriber<T[]>): Promise<void>

    protected releaseItems(subscriber: Subscriber<T[]>, items: StorageItem<T>[]): void {
        const itemsByKey: { [key: StorageKey]: StorageItem<T>[] } = {}
        for (let i of items) {
            if (!itemsByKey[i.key]) itemsByKey[i.key] = []
            itemsByKey[i.key].push(i)
        }

        for (let items of Object.values(itemsByKey)) {
            items.length != 0 && subscriber.next(items.map(i => i.value))
        }
    }
}