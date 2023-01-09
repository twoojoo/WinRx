import { default as IORedisClient } from "ioredis"
import { Redis } from "./QueueManager"

export { stream } from "./sources"

export function redis(client: IORedisClient) {
    return new Redis(client)
}

// import * as ws from "./WindowingSystems"
// import * as sm from "./StateManagers"

// import { Observable, OperatorFunction, Subscriber } from "rxjs"
// import { WindowingSystem, WindowingOptions } from "./Models/WindowingSystem"
// import { Redis } from "ioredis"
// // import { OnBeforeSubscription, OnNext, OperatorCallback, operatorFactory } from "./Operators"

// export { stream } from "./sources"

// export const memory = () => new sm.Memory()
// export const redis = (client: Redis) => new sm.Redis(client)

// type WindowOperator<T> = OperatorFunction<T, T[]>

// export const sessionWindow = <T>(opts: ws.SessionWindowOptions<T>): WindowOperator<T> => {
//     return (source: Observable<T>) => buildOperator(source, opts, new ws.SessionWindow(opts))
// }

// export const tumblingWindow = <T>(opts: ws.TumblingWindowOptions<T>): WindowOperator<T> => {
//     return (source: Observable<T>) => buildOperator(source, opts, new ws.TumblingWindow(opts))
// }

// export const slidingWindow = <T>(opts: ws.SlidingWindowOptions<T>): WindowOperator<T> => {
//     return (source: Observable<T>) => buildOperator(source, opts, new ws.SlidingWindow(opts))
// }

// export const hoppingWindow = <T>(opts: ws.HoppingWindowOptions<T>): WindowOperator<T> => {
//     return (source: Observable<T>) => buildOperator(source, opts, new ws.HoppingWindow(opts))
// }

// // export const snapshotWindow = <T>(opts: win.SnapshotWindowOptions<T>): WindowOperator<T> => {
// //     return (source: Observable<T>) => buildOperator(source, opts, new win.SnapshotWindow(opts))
// // }

// const buildOperator = <T>(source: Observable<T>, opts: WindowingOptions<T>, winSys: WindowingSystem<T>): Observable<T[]> => {
//     const observable = new Observable<T[]>(sub => {
//         winSys.onStart(sub as Subscriber<T[]>)

//         source.subscribe({
//             async next(event: T) {
//                 const formattedEvent = winSys.formatEvent(event)
//                 await winSys.stateManager.enqueue(formattedEvent)
//                 startDequeueloop(sub, winSys)
//             }
//         })
//     })

//     return observable
// }

// // function windowingOperatorFactory<T, R>(source: Observable<T>, opts: WindowingOptions<T>, winSys: WindowingSystem<T>): Observable<T[]> {
// //     const callback: OperatorCallback<T> = async (event: T): Promise<T[]> => {
// //         const formattedEvent = winSys.formatEvent(event)
// //         await winSys.stateManager.enqueue(formattedEvent)
// //         return 
// //     }

// //     const onBeforeSubscription: OnBeforeSubscription = (sub) => winSys.onStart(sub as Subscriber<T[]>)
// //     const onNext: OnNext = (sub, next) => startDequeueloop(sub, winSys)

// //     return operatorFactory(source, callback, onBeforeSubscription, onNext)
// // }

// /** Loop on stateManager's queue and dequeue events in order to process them one by one.
//  * If called while there is another loop runnin, just returns leaving the queue untouched. */
// async function startDequeueloop<T>(subsrciber: Subscriber<T[]>, winSys: WindowingSystem<T>) {
//     if (winSys.isLooping) return
//     winSys.isLooping = true

//     while (!await winSys.stateManager.isQueueEmpty()) {
//         const event = await winSys.stateManager.dequeue()
//         await winSys.onDequeuedEvent(subsrciber, event)
//     }

//     winSys.isLooping = false
// }