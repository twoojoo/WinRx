import { Observer } from "rxjs"
import { ItemToStore, StorageKey } from "../models/Storage"
import { Window, WindowOptions } from "../models/Window"

export type SessionWindowOptions<T> = WindowOptions<T> & { maxDuration: number, timeoutSize: number }

export class SessionWindow<T> extends Window<T> {
    private _maxDuration: number
    private _timeoutSize: number

    private _timeouts: { [key: StorageKey]: NodeJS.Timeout }

    constructor(options: SessionWindowOptions<T>) {
        super({
            storage: options.storage,
            closeOnComplete: options.closeOnComplete,
            closeOnError: options.closeOnError
        })

        this._timeouts = {}
        this._maxDuration = options.maxDuration,
            this._timeoutSize = options.timeoutSize
    }

    onStart(observer: Observer<T[]>): void {
        return
    }

    onItem(observer: Observer<T[]>, item: ItemToStore<T>): void {
        this._timeouts[item.key] = setTimeout(() => {
            this.consumeByKey(observer, item.key)
        }, this._maxDuration)

        this._storage.storeItem(item)
    }

    consume(observer: any): void {
        const keys = this._storage.retrieveKeys()
        keys.forEach(k => this.consumeByKey(observer, k))
    }

    private consumeByKey(observer: any, key: StorageKey) {
        const items = this._storage.retrieveByKey(key)
        this._storage.clearByKey(key)

        for (let [action, itemsByTimestamps] of Object.entries(items)) {
            const items = Object.values(itemsByTimestamps).flat()
            observer[action](items)
        }
    }
}