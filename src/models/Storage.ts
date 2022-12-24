export type StorageKey = number | string
export type StorageAction = "next" | "error" | "complete"

export type StorageItem<T> = {
    key: StorageKey,
    action: StorageAction,
    timestamp: number,
    value: T
}

// export type StorageStructureByTimestamp<T> = {
//     [timestamp: number]: T[]
// }

// export type StorageStructureByAction<T> = {
//     [action: string]: StorageStructureByTimestamp<T>
// }

// export type StorageStructureByKey<T> = {
//     [key: StorageKey]: StorageStructureByAction<T>
// }

export abstract class Storage<T> {
    abstract storeItem(item: StorageItem<T>): Promise<void>
    abstract retrieveByTimestamp(filter: (timestap: number) => boolean): Promise<StorageItem<T>[]>
    abstract retrieveByKey(key: StorageKey): Promise<StorageItem<T>[]>
    abstract retrieveAll(): Promise<StorageItem<T>[]>
    abstract clearByKey(key: StorageKey): Promise<void>
    abstract clearByTimeStamp(filter: (timestap: number) => boolean): Promise<void>
    abstract clearAll(): Promise<void>
    abstract isEmptyByKey(key: StorageKey): Promise<boolean>
    abstract isEmptyAll(): Promise<boolean>
    abstract retrieveKeys(): Promise<StorageKey[]>
}