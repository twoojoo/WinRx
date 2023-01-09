import { WindowingSystem } from "./Windows/model/WindowingSystem";
import { streamFromSubject } from "./Utils/parseStream";
import { Observable, Subject, Subscriber } from "rxjs";
import { Stream } from "./Types/Stream";
import { InnerEvent } from "./event";
import { TumblingWindow, TumblingWindowOptions } from "./Windows/TumblingWindow";
import { HoppingWindow, HoppingWindowOptions } from "./Windows/HoppingWindow";
import { SessionWindow, SessionWindowOptions } from "./Windows/SessionWindow";

export type Windows<T> = {
    tumblingWindow: (options: TumblingWindowOptions<T>) => Stream<InnerEvent<T[]>>,
    hoppingWindow: (options: HoppingWindowOptions<T>) => Stream<InnerEvent<T[]>>,
    sessionWindow: (options: SessionWindowOptions<T>) => Stream<InnerEvent<T[]>>,
}

export function windows<T>(source: Observable<InnerEvent<T>>): Windows<T> {
    return {
        tumblingWindow(options: TumblingWindowOptions<T>): Stream<InnerEvent<T[]>> {
            const win = new TumblingWindow(options)
            const sub = initWindow(source, win)
            return streamFromSubject(sub) 
        },

        hoppingWindow(options: HoppingWindowOptions<T>): Stream<InnerEvent<T[]>> {
            const win = new HoppingWindow(options)
            const sub = initWindow(source, win)
            return streamFromSubject(sub) 
        },

        sessionWindow(options: SessionWindowOptions<T>): Stream<InnerEvent<T[]>> {
            const win = new SessionWindow(options)
            const sub = initWindow(source, win)
            return streamFromSubject(sub) 
        },
    }
}

function initWindow<T>(source: Observable<InnerEvent<T>>, win: WindowingSystem<InnerEvent<T>, T>) {
    const sub = new Subject<InnerEvent<T[]>>()

    win.onStart(sub)

    source.subscribe({
        async next(event: InnerEvent<T>) {
            pushEventToWindow(event, win, sub)
        }
    })

    return sub
}

export async function pushEventToWindow<T>(event: InnerEvent<T>, window: WindowingSystem<InnerEvent<T>, T>, sub: Subject<InnerEvent<T[]>>) {
    const formattedEvent = window.formatEvent(event)
    await window.stateManager.enqueue(formattedEvent)
    startDequeueloop(sub, window)
}

/** Loop on stateManager's queue and dequeue events in order to process them one by one.
 * If called while there is another loop runnin, just returns leaving the queue untouched. */
export async function startDequeueloop<T>(sub: Subject<InnerEvent<T[]>>, win: WindowingSystem<InnerEvent<T>, T>) {
    if (win.isLooping) return
    win.isLooping = true

    while (!await win.stateManager.isQueueEmpty()) {
        const event = await win.stateManager.dequeue()
        await win.onDequeuedEvent(sub, event)
    }

    win.isLooping = false
}