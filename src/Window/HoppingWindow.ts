import { Subscriber } from "rxjs"
import { WindowingSystem, WindowOptions } from "../models/WindowingSystem"
import { Window } from "../models/Window"
import { EventKey } from "../models/Event"

export type HoppingWindowOptions<T> = WindowOptions<T> & { size: number, hop: number }

export class HoppingWindow<T> extends WindowingSystem<T> {
    private size: number
    private hop: number

    private windows: {
        [key: EventKey]: {
            blue: Window<T>,
            green: Window<T>
        }
    } = {}

    private lastOpened: "blue" | "green"

    constructor(options: HoppingWindowOptions<T>) {
        super(options)
        this.size = options.size
        this.hop = options.hop
    }

    async onStart(subscriber: Subscriber<T[]>): Promise<void> {
        this.lastOpened = "blue"
        
        // setInterval(() => {
        //     Object.values(this.windows).forEach(windows =>
        //         windows.forEach(win =>
        //             win.close()
        //         )
        //     )

        //     setTimeout(async () => {
        //         for (let windowsByKey of Object.values(this.windows)) {
        //             for (let win of windowsByKey) {
        //                 if (!win.isClosed()) continue
        //                 const events = await win.flush()
        //                 this.release(subscriber, events)
        //                 win.destroy()
        //             }

        //             windowsByKey = windowsByKey.filter(win => win.isDestroyed())
        //         }

        //     }, this.watermark)
        // }, this.size)
    }

    async onComplete(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onError(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onEvent(subscriber: Subscriber<T[]>, event: Event<T>): Promise<void> {
        const eventKey = event.eventKey

        if (!this.windows[eventKey]) {
            this.windows[eventKey] = [new Window(this.storage)]
            this.windows[eventKey][0].push(event)
        } else {
            const openedWindow = this.windows[eventKey].find(win => !win.isClosed())
            if (!openedWindow) this.windows[eventKey].push(new Window(this.storage))

            const lastWinIndex = this.windows[eventKey].length - 1
            await this.windows[eventKey][lastWinIndex].push(event)
        }
    }

    //     private _size: number
    //     private _hop: number
    //     private _overlapping: boolean

    //     private _startingTimestamp: number
    //     private _lastWindowStartingTimestamp: number = 0

    //     constructor(options: HoppingWindowOptions<T>) {
    //         super(options)

    //         this._size = options.size
    //         this._hop = options.hop
    //         this._overlapping = this._size > this._hop
    //         this._startingTimestamp = Date.now()
    //     }

    //     async onStart(observer: Observer<T[]>): Promise<void> {
    //         this._lastWindowStartingTimestamp = Date.now()
    //         this.startWindow(observer)

    //         setInterval(() => {
    //             this._lastWindowStartingTimestamp = Date.now()
    //             this.startWindow(observer)
    //         }, this._hop)
    //     }

    //     async release(observer: any): Promise<void> {
    //         const items = await this._storage.retrieveAll()
    //         await this._storage.clearAll()
    //         this.releaseItems(observer, items)
    //     }

    //     async onItem(observer: Observer<T[]>, item: StorageItem<T>): Promise<void> {
    //         await this._storage.storeItem(item)
    //     }

    private async startWindow(observer: any) {
        setTimeout(async () => {

            setI
        }, this.size)

            (async () => {
                await delay(this._size)
                const items = await this._storage.retrieveAll()
                if (this._overlapping) await this._storage.clearByTimeStamp(ts => ts < (() => this._lastWindowStartingTimestamp)())
                else await this._storage.clearAll()
                this.releaseItems(observer, items)
            })()
    }
}