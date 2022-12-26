import * as win from "./Window"
import { Observable, OperatorFunction, Subscriber } from "rxjs"
import { Window } from "./models/Window"

export * as Storage from "./Storage"

type WindowOperator<T> = OperatorFunction<T, T[]>

export const sessionWindow = <T>(opts: win.SessionWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, new win.SessionWindow(opts))
}

export const tumblingWindow = <T>(opts: win.TumblingWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, new win.TumblingWindow(opts))
}

export const countingWindow = <T>(opts: win.CountingWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, new win.CountingWindow(opts))
}

export const hoppingWindow = <T>(opts: win.HoppingWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, new win.HoppingWindow(opts))
}

export const snapshotWindow = <T>(opts: win.SnapshotWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, new win.SnapshotWindow(opts))
}

const buildOperator = <T>(source:  Observable<T>, window: Window<T>): Observable<T[]> => new Observable<T[]>(sub => {
    window.onStart(sub as Subscriber<T[]>)

    source.subscribe({
        async next(v: T) {
            await window.onItem(sub as Subscriber<T[]>, {
                key: "default",
                timestamp: Date.now(),
                value: v
            })
        },

        async error(v: T) {
            await window.release(sub as Subscriber<T[]>)
            sub.error([v])
        },

        async complete() {
            await window.release(sub as Subscriber<T[]>)
            sub.complete()
        }
    })
})