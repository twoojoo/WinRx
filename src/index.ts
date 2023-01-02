import * as win from "./Window"
import { Observable, OperatorFunction, Subscriber } from "rxjs"
import { WindowingSystem, WindowOptions } from "./models/WindowingSystem"

export * as Storage from "./Storage"

type WindowOperator<T> = OperatorFunction<T, T[]>

export const sessionWindow = <T>(opts: win.SessionWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, opts, new win.SessionWindow(opts))
}

export const tumblingWindow = <T>(opts: win.TumblingWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, opts, new win.TumblingWindow(opts))
}

// export const countingWindow = <T>(opts: win.CountingWindowOptions<T>): WindowOperator<T> => {
//     return (source: Observable<T>) => buildOperator(source, opts, new win.CountingWindow(opts))
// }

// export const hoppingWindow = <T>(opts: win.HoppingWindowOptions<T>): WindowOperator<T> => {
//     return (source: Observable<T>) => buildOperator(source, opts, new win.HoppingWindow(opts))
// }

// export const snapshotWindow = <T>(opts: win.SnapshotWindowOptions<T>): WindowOperator<T> => {
//     return (source: Observable<T>) => buildOperator(source, opts, new win.SnapshotWindow(opts))
// }

const buildOperator = <T>(source: Observable<T>, opts: WindowOptions<T>, window: WindowingSystem<T>): Observable<T[]> => {
    const observable = new Observable<T[]>(sub => {
        window.onStart(sub as Subscriber<T[]>)

        source.subscribe({
            async next(v: T) {
                await window.onEvent(sub as Subscriber<T[]>, {
                    eventKey: window.getEventKey(v),
                    eventTime: window.getEventTimestamp(v),
                    processingTime: Date.now(),
                    value: v
                })
            },

            async error(v: T) {
                await window.onError(sub as Subscriber<T[]>)
                sub.error([v])
            },

            async complete() {
                await window.onComplete(sub as Subscriber<T[]>)
                sub.complete()
            }
        })
    })

    return observable
}