import { Observer } from "rxjs"
import { ItemToStore } from "../models/Storage"
import { Window, WindowOptions } from "../models/Window"

export type HoppingWindowOptions<T> = WindowOptions<T> & {size: number, hop: number}

export class HoppingWindow<T> extends Window<T> {
    private _size: number
    private _hop: number

    private _interval: NodeJS.Timer | undefined

    constructor(options: HoppingWindowOptions<T>) {
        super({
            storage: options.storage,
            closeOnComplete: options.closeOnComplete,
            closeOnError: options.closeOnError
        })

        this._size = options.size
        this._hop = options.hop
    }

    onStart(observer:  Observer<T[]>): void {
        this._interval = setInterval(() => {
            this.consume(observer)
        }, this._size)
    }

    consume(observer: any): void {
        if (!this._interval) throw Error("missing interval")
        const storage = this._storage.retrieveAll()
        this._storage.clearAll()

        for (let key in storage) {
            for (let action in storage[key]) {
                const items = Object.values(storage[key][action]).flat()
                observer[action](items)
            }
        }
    }

    onItem(observer: Observer<T[]>, item: ItemToStore<T>): void {
        this._storage.storeItem(item)
    }
}