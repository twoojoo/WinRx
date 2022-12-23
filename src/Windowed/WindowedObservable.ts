import { Observable } from "rxjs"
import { Windowed } from "../models/Windowed"
import { WindowedObserver } from "./WindowedObserver"
import { Window } from "../models/Window"

export type WindowOptions<T> = {
    window: Window<T>,
    closeOnError?: boolean
}

export class WindowedObservable<T> extends Windowed<T>{
    private _internalWindowedObserver: WindowedObserver<T> 

    constructor(window: Window<T>) {
        super()
        this._internalWindowedObserver = new WindowedObserver<T>(window)
    }

    from(observable: Observable<T>): Observable<T[]> {
        return new Observable<T[]>(subscriber => {
            observable.subscribe(this._internalWindowedObserver.from({
                next: (v) => subscriber.next((v as any)), 
                error: (v) =>  subscriber.error((v as any)),
                complete: () => subscriber.complete() 
            }))
        })
    }

}

const obs = (new Observable())