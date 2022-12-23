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
    abstract storeItem(item: StorageItem<T>): void
    abstract retrieveByTimestamp(filter: (timestap: number) => boolean): StorageItem<T>[]
    abstract retrieveByKey(key: StorageKey): StorageItem<T>[]
    abstract retrieveAll(): StorageItem<T>[]
    abstract clearByKey(key: StorageKey): void
    abstract clearByTimeStamp(filter: (timestap: number) => boolean): void
    abstract clearAll(): void
    abstract isEmptyByKey(key: StorageKey): boolean
    abstract isEmptyAll(): boolean
    abstract retrieveKeys(): StorageKey[]
}