import { Observer } from "rxjs"
import { StorageItem } from "../models/Storage"
import { Window, WindowOptions } from "../models/Window"

export type HoppingWindowOptions<T> = WindowOptions<T> & {size: number, hop: number}

export class HoppingWindow<T> extends Window<T> {
    private _size: number
    private _hop: number
    private _lastWindowStartingTimestamp: number = 0

    constructor(options: HoppingWindowOptions<T>) {
        super({
            storage: options.storage,
            closeOnComplete: options.closeOnComplete,
            closeOnError: options.closeOnError
        })

        this._size = options.size
        this._hop = options.hop
    }

    onStart(observer: Observer<T[]>): void {
        this.startWindow(observer)

        setInterval(() => {
            this.startWindow(observer)
        }, this._hop)
    }

    consume(observer: any): void {
        const items = this._storage.retrieveAll()
        this._storage.clearAll()
        this.consumeItems(observer, items)
    }

    onItem(observer: Observer<T[]>, item: StorageItem<T>): void {
        this._storage.storeItem(item)
    }

    private startWindow(observer: any) {
        this._lastWindowStartingTimestamp = Date.now()

        setTimeout(() => {
            const items = this._storage.retrieveAll()
            this._storage.clearByTimeStamp(ts => ts < (() => this._lastWindowStartingTimestamp)())
            this.consumeItems(observer, items)
        }, this._size)
    }
}