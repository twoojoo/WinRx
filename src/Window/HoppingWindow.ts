import { Observer } from "rxjs"
import { StorageItem } from "../models/Storage"
import { Window, WindowOptions } from "../models/Window"
import delay from "delay"

export type HoppingWindowOptions<T> = WindowOptions<T> & {size: number, hop: number}

export class HoppingWindow<T> extends Window<T> {
    private _size: number
    private _hop: number
    private _overlapping: boolean

    private _startingTimestamp: number
    private _lastWindowStartingTimestamp: number = 0

    constructor(options: HoppingWindowOptions<T>) {
        super(options)

        this._size = options.size
        this._hop = options.hop
        this._overlapping = this._size > this._hop
        this._startingTimestamp = Date.now()
    }

    async onStart(observer: Observer<T[]>): Promise<void> {
        this._lastWindowStartingTimestamp = Date.now()
        this.startWindow(observer)

        setInterval(() => {
            this._lastWindowStartingTimestamp = Date.now()
            this.startWindow(observer)
        }, this._hop)
    }

    async release(observer: any): Promise<void> {
        const items = await this._storage.retrieveAll()
        await this._storage.clearAll()
        this.releaseItems(observer, items)
    }

    async onItem(observer: Observer<T[]>, item: StorageItem<T>): Promise<void> {
        await this._storage.storeItem(item)
    }

    private async startWindow(observer: any) {
        (async () => {
            await delay(this._size)
            const items = await this._storage.retrieveAll()
            if (this._overlapping) await this._storage.clearByTimeStamp(ts => ts < (() => this._lastWindowStartingTimestamp)())
            else await this._storage.clearAll()
            this.releaseItems(observer, items)
        })()
    }
}