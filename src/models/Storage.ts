export type StorageKey = number | string
export type StorageAction = "next" | "error" | "complete"

export type ItemToStore<T> = {
    key: StorageKey,
    action: StorageAction,
    timestamp: number,
    value: T
}

export type StorageStructureByTimestamp<T> = {
    [timestamp: number]: T[]
}

export type StorageStructureByAction<T> = {
    [action: string]: StorageStructureByTimestamp<T>
}

export type StorageStructureByKey<T> = {
    [key: StorageKey]: StorageStructureByAction<T>
}

export abstract class Storage<T> {
    abstract storeItem(item: ItemToStore<T>): void
    abstract retrieveByKey(key: StorageKey): StorageStructureByAction<T>
    abstract retrieveAll(): StorageStructureByKey<T>
    abstract clearByKey(key: StorageKey): void
    abstract clearByTimeStamp(key: StorageKey): void
    abstract clearAll(): void
    abstract isEmptyByKey(key: StorageKey): boolean
    abstract isEmptyAll(): boolean
    abstract retrieveKeys(): StorageKey[]
}