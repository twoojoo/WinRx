import { Observer } from "rxjs"
import { StateMananger } from "../Models/StateManager"
import { WindowingSystem, WindowingOptions } from "../Models/WindowingSystem"

export type SnapshotWindowOptions<T> = WindowingOptions<T> & { offset: number, tolerance: number }

export class SnapshotWindow<T> extends WindowingSystem<T> {
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
        const items = await this.stateManager.retrieveAll()
        await this.stateManager.clearAll()
        this.releaseItems(observer, items)
    }

    async onItem(observer: Observer<T[]>, item: StorageItem<T>): Promise<void> {
        if (item.timestamp > this._minThreshold && item.timestamp < this._maxThreshold) {
            this.stateManager.storeItem(item)
        }
    }
}