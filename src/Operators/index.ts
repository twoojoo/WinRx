// import { Stream } from "../Types/Stream"
import { Observable } from "rxjs"

type OperatorCallback<T, R> = (event: T) => Promise<R> | R

export function map<T, R>(callback: OperatorCallback<T, R>) {
    return (source: Observable<T>) => operatorFactory(source, callback)
}

export function forEach<T, R = T>(callback: OperatorCallback<T, R>) {
    const overriddenCallback = async (event: T) => {
        callback(event)
        return event
    }
    
    return (source: Observable<T>) => operatorFactory(source, overriddenCallback)
}

const operatorFactory = <T, R>(source: Observable<T>, callback: OperatorCallback<T, R>): Observable<R> => {
    return new Observable<R>(sub => {
        source.subscribe({
            async next(event: T) {
                const result = await callback(event)
                sub.next(result)
            }
        })
    })
}