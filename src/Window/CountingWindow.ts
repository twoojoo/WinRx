import { Observer } from "rxjs"
import { StorageItem, StorageKey } from "../models/Storage"
import { Window, WindowOptions } from "../models/Window"

export type CountingWindowOptions<T> = WindowOptions<T> & { size: number }

export class CountingWindow<T> extends Window<T> {
    private _size: number
    private _counters: { [key: StorageKey]: number } = {}

    constructor(options: CountingWindowOptions<T>) {
        super(options)

        this._size = options.size
    }

    async onStart(observer: Observer<T[]>): Promise<void> {
        return
    }

    async release(observer: any): Promise<void> {
        const items = await this._storage.retrieveAll()
        await this._storage.clearAll()
        this.releaseItems(observer, items)
    }

    async releasePrevious(observer: any, key: StorageKey, lastItemTimestamp: number): Promise<void> {
        const items = await this._storage.retrieveByKey(key/*, (ts) => ts <= lastItemTimestamp**/)
        console.log(items.map(i => i.key))
        await this._storage.clearByKey(key/*, (ts) => ts <= lastItemTimestamp*/)
        this.releaseItems(observer, items)
    }

    async onItem(observer: Observer<T[]>, item: StorageItem<T>): Promise<void> {
        const key = item.key

        if (!this._counters[key]) this._counters[key] = 0
        this._counters[key]++

        const lastItemTimestamp = item.timestamp

        if (this._counters[key] >= this._size) {
            console.log(key, this._counters[key])
            this._counters[key] = 0
            await this._storage.storeItem(item)
            await this.releasePrevious(observer, key, lastItemTimestamp)
        } else await this._storage.storeItem(item)

    }
}