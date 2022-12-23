import { Observer } from "rxjs"
import { StorageItem } from "../models/Storage"
import { Window, WindowOptions } from "../models/Window"

export type TumblingWindowOptions<T> = WindowOptions<T> & {size: number}

export class TumblingWindow<T> extends Window<T> {
    private _size: number

    private _interval: NodeJS.Timer | undefined

    constructor(options: TumblingWindowOptions<T>) {
        super({
            storage: options.storage,
            closeOnComplete: options.closeOnComplete,
            closeOnError: options.closeOnError
        })

        this._size = options.size
    }

    onStart(observer:  Observer<T[]>): void {
        this._interval = setInterval(() => {
            this.release(observer)
        }, this._size)
    }

    release(observer: any): void {
        if (!this._interval) throw Error("missing interval")
        const items = this._storage.retrieveAll()
        this._storage.clearAll()
        this.releaseItems(observer, items)
    }

    onItem(observer: Observer<T[]>, item: StorageItem<T>): void {
        this._storage.storeItem(item)
    }
}