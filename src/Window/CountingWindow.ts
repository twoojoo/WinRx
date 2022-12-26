import { Observer } from "rxjs"
import { StorageItem } from "../models/Storage"
import { Window, WindowOptions } from "../models/Window"

export type CountingWindowOptions<T> = WindowOptions<T> & {size: number}

export class CountingWindow<T> extends Window<T> {
    private _size: number
    private _counter: number = 0

    constructor(options: CountingWindowOptions<T>) {
        super({
            storage: options.storage,
            closeOnComplete: options.closeOnComplete,
            closeOnError: options.closeOnError
        })

        this._size = options.size
    }

    async onStart(observer:  Observer<T[]>): Promise<void> {
        return
    }

    async release(observer: any): Promise<void> {
        const items = await this._storage.retrieveAll()
        await this._storage.clearAll()
        this.releaseItems(observer, items)
    }

    async onItem(observer: Observer<T[]>, item: StorageItem<T>): Promise<void> {
        await this._storage.storeItem(item)
        this._counter ++
    
        if (this._counter >= this._size) {
            this.release(observer)
            this._counter = 0
        }
    }
}