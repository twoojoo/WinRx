import { HoppingWindow, HoppingWindowOptions, SessionWindow, SessionWindowOptions, TumblingWindow, TumblingWindowOptions } from "../windows/windowingSystems";
// import { WindowingSystem } from "../windows/models/WindowingSystem";
import { streamFromSubject } from "../stream";
import { Subject } from "rxjs";
import { Stream } from "../stream";
import { MetaEvent } from "../event";

export type Windows<E> = {
    tumblingWindow: (name: string, options: TumblingWindowOptions<MetaEvent<E>>) => Stream<E[]>,
    hoppingWindow: (name: string, options: HoppingWindowOptions<MetaEvent<E>>) => Stream<E[]>,
    sessionWindow: (name: string, options: SessionWindowOptions<MetaEvent<E>>) => Stream<E[]>,
}

export function windowsFactory<E>(source: Stream<E>): Windows<E> {
    return {
        tumblingWindow(name: string, options: TumblingWindowOptions<MetaEvent<E>>): Stream<E[]> {
            if (source.ctx.windows.includes(name)) throw Error(`a window named "${name}" already exists for stream "${source.name()}"`)
            source.ctx.windows.push(name)
            const sub = new Subject<MetaEvent<E[]>>()
            // const win = new TumblingWindow(options)
            // const sub = initWindow(subjectFromStream(source), win)
            return streamFromSubject(source.ctx, sub) 
        },

        hoppingWindow(name: string, options: HoppingWindowOptions<MetaEvent<E>>): Stream<E[]> {
            if (source.ctx.windows.includes(name)) throw Error(`a window named "${name}" already exists for stream "${source.name()}"`)
            source.ctx.windows.push(name)
            const sub = new Subject<MetaEvent<E[]>>()
            // const win = new HoppingWindow(options)
            // const sub = initWindow(subjectFromStream(source), win)
            return streamFromSubject(source.ctx, sub) 
        },

        sessionWindow(name: string, options: SessionWindowOptions<MetaEvent<E>>): Stream<E[]> {
            if (source.ctx.windows.includes(name)) throw Error(`a window named "${name}" already exists for stream "${source.name()}"`)
            source.ctx.windows.push(name)
            const sub = new Subject<MetaEvent<E[]>>()
            // const win = new SessionWindow(options)
            // const sub = initWindow(subjectFromStream(source), win)
            return streamFromSubject(source.ctx, sub) 
        },
    }
}

// function initWindow<T>(source: Observable<T>, win: WindowingSystem<T>) {
//     const sub = new Subject<T[]>()

//     win.onStart((sub as unknown) as Subscriber<T[]>)

//     source.subscribe({
//         async next(event: T) {
//             pushEventToWindow(event, win, sub)
//         }
//     })

//     return sub
// }

// export async function pushEventToWindow<T>(event: T, window: WindowingSystem<T>, sub: Subject<T[]>) {
//     const formattedEvent = window.formatEvent(event)
//     await window.stateManager.enqueue(formattedEvent)
//     startDequeueloop(sub, window)
// }

// /** Loop on stateManager's queue and dequeue events in order to process them one by one.
//  * If called while there is another loop runnin, just returns leaving the queue untouched. */
// export async function startDequeueloop<T>(sub: Subject<T[]>, win: WindowingSystem<T>) {
//     if (win.isLooping) return
//     win.isLooping = true

//     while (!await win.stateManager.isQueueEmpty()) {
//         const event = await win.stateManager.dequeue()
//         await win.onDequeuedEvent((sub as unknown) as Subscriber<T[]>, event)
//     }

//     win.isLooping = false
// }