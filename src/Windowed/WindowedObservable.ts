import { Observable, Observer } from "rxjs"
import { Windowed } from "../models/Windowed"
import { WindowedObserver } from "./WindowedObserver"
import { EventEmitter } from "events"
import Redis from "ioredis"
import { Window } from "../models/Window"

export type WindowOptions<T> = {
    window: Window<T>,
    closeOnError?: boolean
}

export class WindowedObservable<T> extends Windowed<T>{
    private _internalWindowedObserver: WindowedObserver<T> 

    constructor(options: WindowOptions<T>) {
        super()
        this._internalWindowedObserver = new WindowedObserver<T>(options)
    }

    from(observable: Observable<T>): Observable<T[]> {

        const newObservable = new Observable<T[]>(subscriber => {
            observable.subscribe(this._internalWindowedObserver.from({
                next: (v) => subscriber.next((v as any)), 
                error: (v) =>  subscriber.error((v as any)),
                complete: () => subscriber.complete() 
            }))
        })

        return newObservable
    }

}

const obs = (new Observable())