import * as win from "./Window"
import { Observable, OperatorFunction, Subscriber } from "rxjs"
import { Window, WindowOptions } from "./models/Window"

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

export const hoppingWindow = <T>(opts: win.HoppingWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, opts, new win.HoppingWindow(opts))
}

export const snapshotWindow = <T>(opts: win.SnapshotWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, opts, new win.SnapshotWindow(opts))
}

const buildOperator = <T>(source: Observable<T>, opts: WindowOptions<T>, window: Window<T>): Observable<T[]> => {
    const observable = new Observable<T[]>(sub => {
        window.onStart(sub as Subscriber<T[]>)

        source.subscribe({
            async next(v: T) {
                await window.onItem(sub as Subscriber<T[]>, {
                    key: window.getEventKey(v),
                    timestamp: window.getEventTimestamp(v),
                    value: v
                })
            },

            async error(v: T) {
                if (opts.closeOnError) await window.release(sub as Subscriber<T[]>)
                await window._storage.clearAll()
                sub.error([v])
            },

            // async complete() {
            //     if (opts.closeOnComplete) await window.release(sub as Subscriber<T[]>)
            //     await window._storage.clearAll()
            //     sub.complete()
            // }
        })
    })

    return observable
}