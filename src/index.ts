import * as ws from "./WindowingSystem"
import * as sm from "./StateManager"

import { Observable, OperatorFunction, Subscriber } from "rxjs"
import { WindowingSystem, WindowingOptions } from "./models/WindowingSystem"
import { Redis } from "ioredis"


export const memory = () => new sm.Memory()
export const redis = (client: Redis) => new sm.Redis(client)

type WindowOperator<T> = OperatorFunction<T, T[]>

export const sessionWindow = <T>(opts: ws.SessionWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, opts, new ws.SessionWindow(opts))
}

export const tumblingWindow = <T>(opts: ws.TumblingWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, opts, new ws.TumblingWindow(opts))
}

export const slidingWindow = <T>(opts: ws.SlidingWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, opts, new ws.SlidingWindow(opts))
}

export const hoppingWindow = <T>(opts: ws.HoppingWindowOptions<T>): WindowOperator<T> => {
    return (source: Observable<T>) => buildOperator(source, opts, new ws.HoppingWindow(opts))
}

// export const snapshotWindow = <T>(opts: win.SnapshotWindowOptions<T>): WindowOperator<T> => {
//     return (source: Observable<T>) => buildOperator(source, opts, new win.SnapshotWindow(opts))
// }

const buildOperator = <T>(source: Observable<T>, opts: WindowingOptions<T>, winSys: WindowingSystem<T>): Observable<T[]> => {
    const observable = new Observable<T[]>(sub => {
        winSys.onStart(sub as Subscriber<T[]>)

        source.subscribe({
            async next(event: T) {
                const formattedEvent = winSys.formatEvent(event)
                await winSys.stateManager.enqueue(formattedEvent)
                startDequeueloop(sub, winSys)
            }
        })
    })

    return observable
}

/** Loop on stateManager's queue and dequeue events in order to process them one by one.
 * If called while there is another loop runnin, just returns leaving the queue untouched. */
async function startDequeueloop<T>(subsrciber: Subscriber<T[]>, winSys: WindowingSystem<T>) {
    if (winSys.isLooping) return
    winSys.isLooping = true

    while (!await winSys.stateManager.isQueueEmpty()) {
        const event = await winSys.stateManager.dequeue()
        await winSys.onDequeuedEvent(subsrciber, event)
    }

    winSys.isLooping = false
}