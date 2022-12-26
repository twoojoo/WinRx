import * as win from "./Window"
import { Observable } from "rxjs"
import { Window } from "./models/Window"

export * as Storage from "./Storage"

export const sessionWindow = <T>(opts: win.SessionWindowOptions<T>) => {
    return (source: Observable<T>) => buildOperator(source, new win.SessionWindow(opts))
}

export const tumblingWindow = <T>(opts: win.TumblingWindowOptions<T>) => {
    return (source: Observable<T>) => buildOperator(source, new win.TumblingWindow(opts))
}

export const countingWindow = <T>(opts: win.CountingWindowOptions<T>) => {
    return (source: Observable<T>) => buildOperator(source, new win.CountingWindow(opts))
}

export const hoppingWindow = <T>(opts: win.HoppingWindowOptions<T>) => {
    return (source: Observable<T>) => buildOperator(source, new win.HoppingWindow(opts))
}

export const snapshotWindow = <T>(opts: win.SnapshotWindowOptions<T>) => {
    return (source: Observable<T>) => buildOperator(source, new win.SnapshotWindow(opts))
}

const buildOperator = <T>(source:  Observable<T>, window: Window<T>) => new Observable(sub => {
    source.subscribe({
        async next(v: T) {
            await window.onItem(sub, {
                key: "default",
                timestamp: Date.now(),
                value: v
            })
        },

        async error(v: T) {
            await window.release(sub)
            sub.error([v])
        },

        async complete() {
            await window.release(sub)
            sub.complete()
        }
    })
})