import { Observer } from "rxjs"
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

    open(observer:  Observer<T[]>): void {
        this._interval = setInterval(() => {
            this.consume(observer)
        }, this._size)
    }

    consume(observer: any): void {
        if (!this._interval) throw Error("missing interval")
        const storage = this._storage.retrieveAll()

        for (let key in storage) {
            for (let action in storage[key]) {
                const items = Object.values(storage[key][action]).flat()
                observer[action](items)
            }
        }
    }
}