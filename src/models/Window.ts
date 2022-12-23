import { Observer } from "rxjs";
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
        this._closeOnError = options.closeOnError || false
        this._closeOnComplete = options.closeOnComplete || false
        // this._persistData = options.persistData || false
    }

    abstract onStart(observer: Observer<T[]>): void
    abstract onItem(observer: Observer<T[]>, item: StorageItem<T>): void
    abstract consume(observer: Observer<T[]>): void

    protected consumeItems(observer: Observer<T[]>, items: StorageItem<T>[]) {
        const itemsByKey: {[key: StorageKey]: StorageItem<T>[]} = {}
        for (let i of items) {
            if (!itemsByKey[i.key]) itemsByKey[i.key] = []
            itemsByKey[i.key].push(i)
        }

        for (let items of Object.values(itemsByKey)) {
            const nextItems = []
            const errorItems = []
    
            while (items.length != 0) {
                const item = items.shift()
                if (item?.action == "next") nextItems.push(item.value)
                else if (item?.action == "error") errorItems.push(item.value)
                else throw Error("unknow action")
            }
    
            nextItems.length != 0 && observer.next(nextItems)
            errorItems.length != 0 &&observer.error(errorItems)
        }
    }
}

//callback: (items: ({ value: T, timestamp: number, extra: StorageItemExta })[]