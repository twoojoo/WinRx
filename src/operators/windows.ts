import { tumblingWindow, TumblingWindowOptions } from "../windows/tumblingWindow";
import { streamFromSubject, subjectFromStream } from "../stream";
import { MetaEvent } from "../event";
import { Stream } from "../stream";
import { Subject } from "rxjs";

export type Windows<E> = {
    tumblingWindow: (name: string, options: TumblingWindowOptions) => Stream<E[]>,
    // hoppingWindow: (name: string, options: HoppingWindowOptions<MetaEvent<E>>) => Stream<E[]>,
    // sessionWindow: (name: string, options: SessionWindowOptions<MetaEvent<E>>) => Stream<E[]>,
}

export function windowsFactory<E>(source: Stream<E>): Windows<E> {
    return {
        tumblingWindow(name: string, opts: TumblingWindowOptions): Stream<E[]> {
            const sub = init(name, source)
            const win = tumblingWindow(source.ctx, name, opts, sub)

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E>) {
                    event.tracking.windows[name] = {ingestionTime: Date.now()}
                    win.onEvent(event)
                }
            })

            return streamFromSubject(source.ctx, sub) 
        },

        // hoppingWindow(name: string, opts: HoppingWindowOptions<MetaEvent<E>>): Stream<E[]> {
        //     const sub = init(name, source)
        //     // const win = new HoppingWindow(options)
        //     // const sub = initWindow(subjectFromStream(source), win)
        //     return streamFromSubject(source.ctx, sub) 
        // },

        // sessionWindow(name: string, opts: SessionWindowOptions<MetaEvent<E>>): Stream<E[]> {
        //     const sub = init(name, source)
        //     // const win = new SessionWindow(options)
        //     // const sub = initWindow(subjectFromStream(source), win)
        //     return streamFromSubject(source.ctx, sub) 
        // },
    }
}

function init<E>(name: string, source: Stream<E>): Subject<MetaEvent<E[]>> {
    if (source.ctx.windows.includes(name)) throw Error(`a window named "${name}" already exists for stream "${source.name()}"`)
    source.ctx.windows.push(name)
    return new Subject<MetaEvent<E[]>>()
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