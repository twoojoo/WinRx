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

    async onStart(observer:  Observer<T[]>): Promise<void> {
        this._interval = setInterval(() => {
            this.release(observer)
        }, this._size)
    }

    async release(observer: any): Promise<void> {
        if (!this._interval) throw Error("missing interval")
        const items = await this._storage.retrieveAll()
        await this._storage.clearAll()
        this.releaseItems(observer, items)
    }

    async onItem(observer: Observer<T[]>, item: StorageItem<T>): Promise<void> {
        await this._storage.storeItem(item)
    }
}