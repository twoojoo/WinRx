import {Event, EventKey} from "./Event"

type GetParams = {
    windowId?: string,
    eventKey?: EventKey,
    eventTime?: (timestamp: number) => boolean,
    processingTime?: (timestamp: number) => boolean
}

export abstract class Storage<T> {
    abstract push(event: Required<Event<T>>): Promise<void>
    abstract flush(windowId: string): Promise<Event<T>[]>
    abstract get(windowId: string): Promise<Event<T>[]>
    // abstract retrieveByKey(key: StorageKey): Promise<StorageItem<T>[]>
    // abstract retrieveByWindowId(winId: string): Promise<StorageItem<T>[]>
    // abstract retrieveByKeyAndWindowId(key: StorageKey, winId: string): Promise<StorageItem<T>[]>
    // abstract retrieveByTimestamp(filter: (timestap: number) => boolean): Promise<StorageItem<T>[]>
    // abstract retrieveByKeyAndTimestamp(key: StorageKey, filter: (timestap: number) => boolean): Promise<StorageItem<T>[]>
    // abstract retrieveAll(): Promise<StorageItem<T>[]>
    // abstract clearByKey(key: StorageKey): Promise<void>
    // abstract clearByTimeStamp(filter: (timestap: number) => boolean): Promise<void>
    // abstract clearByKeyAndTimeStamp(key: StorageKey, filter: (timestap: number) => boolean): Promise<void>
    // abstract clearByKeyAndWindowId(key: StorageKey, winId: string): Promise<void>
    // abstract clearByWindowId(winId: string): Promise<void>
    // abstract clearAll(): Promise<void>
    // abstract isEmptyByKey(key: StorageKey): Promise<boolean>
    // abstract isEmptyAll(): Promise<boolean>
    // abstract retrieveKeys(): Promise<StorageKey[]>
}