import { Observer } from "rxjs"
import { StorageKey } from "../models/Storage"
import { Window } from "../models/Window"
import { Windowed } from "../models/Windowed"

enum ObserverAction {
    Next = "next",
    Error = "error",
    Complete = "complete"
}

export type WindowOptions<T> = {
    window: Window<T>,
    closeOnError?: boolean
}

export class WindowedObserver<T> extends Windowed<T> {
    private _window: Window<T>
    private _closeOnError: boolean    
    private _observer: any //should be observer but tsc give compile errors
    
    constructor(options: WindowOptions<T>) {
        super()
        this._window = options.window
        this._closeOnError = options.closeOnError || false
    }

    /** Derive WindowedObserver from an RXJS Observable. */
    from(observer: Observer<T>): Observer<T> {
        this._observer = Object.assign({}, observer)
        
        observer.next = (value: T) => {
            const key = this.getEventKey(value)
            const timestamp = this.getEventTimestamp(value)

            if (this._window._storage.isEmpty(key)) this.openWindow(key)
            
            this._window._storage.storeItem(key, {
                timestamp,
                value,
                extra: {observerAction: ObserverAction.Next}
            })
        }
        
        observer.error = (value: T) => {
            const key = this.getEventKey(value)
            const timestamp = this.getEventTimestamp(value)

            if (this._window._storage.isEmpty(key)) this.openWindow(key)
            
            this._window._storage.storeItem(key, {
                timestamp,
                value,
                extra: {observerAction: ObserverAction.Error}
            })
            
            if (this._closeOnError) {
                const items = this._window.consume(key)
                this._observer!.next (items.map(i => i.value))
                // for (let item of items) this._observer![item.extra.observerAction!](item.value)
            }
        }
        
        observer.complete = () => {
            const items = this._window.consumeAll()
            this._observer!.next (items.map(i => i.value))
            // for (let item of items) this._observer![item.extra.observerAction!](item.value)
        }
        
        return observer
    }

    private openWindow(key: StorageKey) {
        this._window.open(key, (items) => this._observer!.next (items.map(i => i.value)))
    }
}









