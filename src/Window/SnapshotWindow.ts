import { Observer } from "rxjs"
import { StorageItem } from "../models/Storage"
import { Window, WindowOptions } from "../models/Window"

export type SnapshotWindowOptions<T> = WindowOptions<T> & { offset: number, tolerance: number }

export class SnapshotWindow<T> extends Window<T> {
    private _tolerance: number
    private _offset: number

    private _minThreshold: number
    private _maxThreshold: number
    
    constructor(options: SnapshotWindowOptions<T>) {
        super({
            storage: options.storage,
            closeOnComplete: options.closeOnComplete,
            closeOnError: options.closeOnError
        })

        this._offset = options.offset
        this._tolerance = options.tolerance

        const timestamp = Date.now() + this._offset
        this._minThreshold = timestamp - this._tolerance
        this._maxThreshold = timestamp + this._tolerance
    }

    onStart(observer: Observer<T[]>): void {
        setTimeout(() => this.release(observer), this._offset + this._tolerance)
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