import { Observer } from "rxjs"
import { ItemToStore, StorageKey } from "../models/Storage"
import { Window, WindowOptions } from "../models/Window"

export type SessionWindowOptions<T> = WindowOptions<T> & { maxDuration: number, timeoutSize: number }

export class SessionWindow<T> extends Window<T> {
    private _maxDuration: number
    private _timeoutSize: number

    private _timeouts: {
        [key: StorageKey]: {
            windowDuration: NodeJS.Timeout | undefined,
            windowTimeout: NodeJS.Timeout | undefined
        }
    }

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
        const key = item.key
        if (!this._timeouts[key]) this._timeouts[key] = {
            windowDuration: undefined,
            windowTimeout: undefined
        }

        //On new item, if duration timeout doesn't exist, start one
        //After max window duration consumes all saved items and reset alk key timeouts
        if (!this._timeouts[key].windowDuration) {
            this._timeouts[key].windowDuration = setTimeout(() => {
                if (this._timeouts[key].windowTimeout) clearTimeout(this._timeouts[key].windowTimeout)
                this.consumeByKey(observer, key)
                delete this._timeouts[key]
            }, this._maxDuration)
        }

        //On any new item rest window timeout. 
        //If timeout ends, consume all messages and reset all key timeouts
        if (this._timeouts[key].windowTimeout) clearTimeout(this._timeouts[key].windowTimeout)
        this._timeouts[key].windowTimeout = setTimeout(() => {
            if (this._timeouts[key].windowDuration) clearTimeout(this._timeouts[key].windowDuration)
            this.consumeByKey(observer, key)
            delete this._timeouts[key]
        }, this._timeoutSize)

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