import { Observer, Subscriber } from "rxjs";
import { Memory } from "../Storage";
import { StorageItem, Storage, StorageKey } from "./Storage";

export type WindowOptions<T> = {
    storage?: Storage<T>,
    closeOnError?: boolean,
    closeOnComplete?: boolean
    // persistData?: boolean
}

export abstract class Window<T> {
    readonly _storage: Storage<T>
    readonly _closeOnError: boolean
    readonly _closeOnComplete: boolean
    // readonly _persistData: boolean

    constructor(options: WindowOptions<T>) {
        this._storage = options.storage || new Memory()
        this._closeOnError = options.closeOnError || true
        this._closeOnComplete = options.closeOnComplete || true
        // this._persistData = options.persistData || false
    }

    abstract onStart(subscriber: Subscriber<T[]>): Promise<void>
    abstract onItem(subscriber: Subscriber<T[]>, item: StorageItem<T>): Promise<void>
    abstract release(subscriber: Subscriber<T[]>): Promise<void>

    protected releaseItems(subscriber: Subscriber<T[]>, items: StorageItem<T>[]): void {
        const itemsByKey: {[key: StorageKey]: StorageItem<T>[]} = {}
        for (let i of items) {
            if (!itemsByKey[i.key]) itemsByKey[i.key] = []
            itemsByKey[i.key].push(i)
        }

        for (let items of Object.values(itemsByKey)) {
            // const nextItems = []
            // const errorItems = []
    
            // while (items.length != 0) {
            //     const item = items.shift()
            //     if (item?.action == "next") nextItems.push(item.value)
            //     else throw Error("unknow action")
            // }
    
            items.length != 0 && subscriber.next(items.map(i => i.value))
            // errorItems.length != 0 && subscriber.error(errorItems)
        }
    }
}

//callback: (items: ({ value: T, timestamp: number, extra: StorageItemExta })[]