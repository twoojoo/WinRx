import * as win from "./Windows"
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

// export const slidingWindow = <T>(opts: win.SlidingWindowOptions<T>): WindowOperator<T> => {
//     return (source: Observable<T>) => buildOperator(source, opts, new win.SlidingWindow(opts))
// }


// export const countingWindow = <T>(opts: win.CountingWindowOptions<T>): WindowOperator<T> => {
//     return (source: Observable<T>) => buildOperator(source, opts, new win.CountingWindow(opts))
// }

// export const hoppingWindow = <T>(opts: win.HoppingWindowOptions<T>): WindowOperator<T> => {
//     return (source: Observable<T>) => buildOperator(source, opts, new win.HoppingWindow(opts))
// }

// export const snapshotWindow = <T>(opts: win.SnapshotWindowOptions<T>): WindowOperator<T> => {
//     return (source: Observable<T>) => buildOperator(source, opts, new win.SnapshotWindow(opts))
// }

const buildOperator = <T>(source: Observable<T>, opts: WindowOptions<T>, window: Window<T>): Observable<T[]> => {
    const observable = new Observable<T[]>(sub => {
        window.onStart(sub as Subscriber<T[]>)

        source.subscribe({
            async next(event: T) {
                const formattedEvent = window.formatEvent(event)
                await window.storage.enqueue(formattedEvent)
                startDequeueloop(sub, window)
            }
        })
    })

    return observable
}


/** Loop on window's storage queue and dequeue event in order to process them one by one.
 * If called while there is another loop runnin, just returns leaving the queue untouched. */
async function startDequeueloop<T>(subsrciber: Subscriber<T[]>, window: Window<T>) {
    if (window.isLooping) return
    window.isLooping = true

    while (!await window.storage.isQueueEmpty()) {
        const event = await window.storage.dequeue()
        await window.onDequeuedEvent(subsrciber, event)
    }

    window.isLooping = false
}