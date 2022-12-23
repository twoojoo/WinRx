import { StorageKey, StorageItemExta, Storage } from "../models/Storage"
import { Window } from "../models/Window"

export class TumblingWindow<T> extends Window<T> {
    private _size: number
    private _timeouts: { [key: StorageKey]: NodeJS.Timeout } = {}

    constructor(storage: Storage<T>, size: number) {
        super(storage)
        this._size = size
    }

    open(key: StorageKey, callback: (items: { value: T; timestamp: number; extra: StorageItemExta }[]) => any): void {
        if (this._timeouts[key]) throw Error("window timeout still opened")

        this._timeouts[key] = setTimeout(() => {
            const items = this.consume(key)
            callback(items)
        }, this._size)
    }

    consume(key: StorageKey): { value: T; timestamp: number; extra: StorageItemExta; }[] {
        if (!this._timeouts[key]) return [] //window already closed
        const items = this._storage.retrieveItems(key)
        this._storage.clear(key)

        clearTimeout(this._timeouts[key])
        delete this._timeouts[key]

        return items
    }

    consumeAll(): { value: T; timestamp: number; extra: StorageItemExta; }[] {
        let items: { value: T, timestamp: number, extra: StorageItemExta}[] = []

        for (let key in this._timeouts) {
            items = items.concat(...this.consume(key))
        }

        return items
    }
}