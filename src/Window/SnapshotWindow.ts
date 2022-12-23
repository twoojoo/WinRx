import { Observer } from "rxjs"
import { StorageItem } from "../models/Storage"
import { Window, WindowOptions } from "../models/Window"

export type SnapshotWindowOptions<T> = WindowOptions<T> & {timestamp: number, tolerance: number}

export class SnapshotWindow<T> extends Window<T> {
    private _minThreshold: number
    private _maxThreshold: number
    private _timestamp: number 
    private _tolerance: number

    constructor(options: SnapshotWindowOptions<T>) {
        super({
            storage: options.storage,
            closeOnComplete: options.closeOnComplete,
            closeOnError: options.closeOnError
        })

        const {timestamp, tolerance} = options

        this._minThreshold = timestamp - tolerance
        this._maxThreshold = timestamp + tolerance
        this._timestamp = timestamp
        this._tolerance = tolerance
    }

    onStart(observer:  Observer<T[]>): void {
        const delay = this._timestamp - Date.now() 
        if (delay < 1) throw Error("timestamp must be in the future")
        setTimeout(() => this.release(observer), delay + this._tolerance)
    }

    release(observer: any): void {
        const items = this._storage.retrieveAll()
        this._storage.clearAll()
        this.releaseItems(observer, items)
    }

    onItem(observer: Observer<T[]>, item: StorageItem<T>): void {
        if (item.timestamp > this._minThreshold && item.timestamp < this._maxThreshold) {
            this._storage.storeItem(item)
        }
    }
}