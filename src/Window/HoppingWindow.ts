import { Observer } from "rxjs"
import { StorageItem } from "../models/Storage"
import { Window, WindowOptions } from "../models/Window"

export type HoppingWindowOptions<T> = WindowOptions<T> & {size: number, hop: number}

export class HoppingWindow<T> extends Window<T> {
    private _size: number
    private _hop: number
    private _overlapping: boolean

    private _startingTimestamp: number
    private _lastWindowStartingTimestamp: number = 0

    constructor(options: HoppingWindowOptions<T>) {
        super({
            storage: options.storage,
            closeOnComplete: options.closeOnComplete,
            closeOnError: options.closeOnError
        })

        this._size = options.size
        this._hop = options.hop
        this._overlapping = this._size > this._hop
        this._startingTimestamp = Date.now()
    }

    onStart(observer: Observer<T[]>): void {
        this._lastWindowStartingTimestamp = Date.now()
        this.startWindow(observer)

        setInterval(() => {
            this._lastWindowStartingTimestamp = Date.now()
            this.startWindow(observer)
        }, this._hop)
    }

    release(observer: any): void {
        const items = this._storage.retrieveAll()
        this._storage.clearAll()
        this.releaseItems(observer, items)
    }

    onItem(observer: Observer<T[]>, item: StorageItem<T>): void {
        this._storage.storeItem(item)
    }

    private startWindow(observer: any) {
        setTimeout(() => {
            const items = this._storage.retrieveAll()
            if (this._overlapping) this._storage.clearByTimeStamp(ts => ts < (() => this._lastWindowStartingTimestamp)())
            else this._storage.clearAll()
            this.releaseItems(observer, items)
        }, this._size)
    }
}