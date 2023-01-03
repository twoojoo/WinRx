import { Observer } from "rxjs"
import { Storage } from "../models/Storage"
import { Window, WindowOptions } from "../models/Window"

export type SnapshotWindowOptions<T> = WindowOptions<T> & { offset: number, tolerance: number }

export class SnapshotWindow<T> extends Window<T> {
    private _tolerance: number
    private _offset: number

    private _minThreshold: number
    private _maxThreshold: number
    
    constructor(options: SnapshotWindowOptions<T>) {
        super(options)

        this._offset = options.offset
        this._tolerance = options.tolerance

        const timestamp = Date.now() + this._offset
        this._minThreshold = timestamp - this._tolerance
        this._maxThreshold = timestamp + this._tolerance
    }

    async onStart(observer: Observer<T[]>): Promise<void> {
        setTimeout(() => this.release(observer), this._offset + this._tolerance)
    }

    async release(observer: any): Promise<void> {
        const items = await this._storage.retrieveAll()
        await this._storage.clearAll()
        this.releaseItems(observer, items)
    }

    async onItem(observer: Observer<T[]>, item: StorageItem<T>): Promise<void> {
        if (item.timestamp > this._minThreshold && item.timestamp < this._maxThreshold) {
            this._storage.storeItem(item)
        }
    }
}