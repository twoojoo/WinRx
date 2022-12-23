import { StorageKey } from "./Storage"

export abstract class Windowed<T> {

    protected _timestampExtractor: ((value: T) => number) | undefined = undefined
    protected _keyExtractor: ((value: T) => number | string) | undefined = undefined

    constructor () {}

    protected getEventTimestamp(value: T): number {
        return this._timestampExtractor ?
        this._timestampExtractor(value) :
        Date.now()
    }
    
    protected getEventKey(value: T): StorageKey {
        return this._keyExtractor ?
        this._keyExtractor(value) :
        "default"
    }   

     /** Extract the event time from the observed value. Default to current timestamp. */
    timestampFrom(extractor: (value: T) => number) {
        this._timestampExtractor = extractor
        return this
    }
    
    /** Create multiple parallel windows by providing a key extracted from the event value. */
    splitByKey(extractor: (value: T) => StorageKey) {
        this._keyExtractor = extractor
        return this
    }
    
}