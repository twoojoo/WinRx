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

    onStart(observer:  Observer<T[]>): void {
        return
    }

    consume(observer: any): void {
        const items = this._storage.retrieveAll()
        this._storage.clearAll()
        this.consumeItems(observer, items)
    }

    onItem(observer: Observer<T[]>, item: StorageItem<T>): void {
        this._storage.storeItem(item)
        this._counter ++
    
        if (this._counter >= this._size) {
            this.consume(observer)
            this._counter = 0
        }
    }
}