export type StorageKey = number | string
export type StorageItemExta = { observerAction?: string }

export abstract class Storage<T> {

    abstract storeItem(key: StorageKey, item: { value: T, timestamp: number, extra: StorageItemExta }): void
    abstract retrieveItems(key: StorageKey): { value: T; timestamp: number; extra: StorageItemExta }[]
    abstract clear(key: StorageKey): void
    abstract isEmpty(key: StorageKey): boolean
}