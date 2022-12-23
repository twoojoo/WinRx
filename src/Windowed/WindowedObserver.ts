import { Observer, Subject } from "rxjs"
import { Window } from "../models/Window"
import { Windowed } from "../models/Windowed"

export type WindowOptions<T> = {
    window: Window<T>
}

export class WindowedObserver<T> extends Windowed<T> {
    private _window: Window<T>
    
    constructor(window: Window<T>) {
        super()
        this._window = window
    }

    /** Derive WindowedObserver from an RXJS Observable. */
    from(observer: Observer<T> | Subject<T>): Observer<T> | Subject<T> {
        const newObserver = Object.assign({}, observer) as Observer<T[]> | Subject<T[]>
        this._window.onStart(newObserver)
        
        observer.next = (value: T) => {
            const key = this.getEventKey(value)
            const timestamp = this.getEventTimestamp(value)
            
            this._window.onItem(newObserver, {
                key,
                timestamp,
                value,
                action: "next"
            })
        }
        
        observer.error = (value: T) => {
            const key = this.getEventKey(value)
            const timestamp = this.getEventTimestamp(value)
            
            this._window.onItem(newObserver, {
                key,
                timestamp,
                value,
                action: "error"
            })
        }
        
        observer.complete = () => {
            if (this._window._closeOnComplete) 
                this._window.release(newObserver)
            newObserver.complete()
        }
        
        return observer
    }
}









