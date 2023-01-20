import { HoppingWindow, HoppingWindowOptions, SessionWindow, SessionWindowOptions, TumblingWindow, TumblingWindowOptions } from "../windows/windowingSystems";
import { WindowingSystem } from "../windows/models/WindowingSystem";
import { streamFromSubject, subjectFromStream } from "../stream";
import { Observable, Subject, Subscriber } from "rxjs";
import { Stream } from "../stream";
import { MetaEvent } from "../event";

export type Windows<E> = {
    tumblingWindow: (options: TumblingWindowOptions<MetaEvent<E>>) => Stream<E[]>,
    hoppingWindow: (options: HoppingWindowOptions<MetaEvent<E>>) => Stream<E[]>,
    sessionWindow: (options: SessionWindowOptions<MetaEvent<E>>) => Stream<E[]>,
}

export function windowsFactory<E>(source: Stream<E>): Windows<E> {
    return {
        tumblingWindow(options: TumblingWindowOptions<MetaEvent<E>>): Stream<E[]> {
            const win = new TumblingWindow(options)
            const sub = initWindow(subjectFromStream(source), win)
            return streamFromSubject(source.name(), sub) 
        },

        hoppingWindow(options: HoppingWindowOptions<MetaEvent<E>>): Stream<E[]> {
            const win = new HoppingWindow(options)
            const sub = initWindow(subjectFromStream(source), win)
            return streamFromSubject(source.name(), sub) 
        },

        sessionWindow(options: SessionWindowOptions<MetaEvent<E>>): Stream<E[]> {
            const win = new SessionWindow(options)
            const sub = initWindow(subjectFromStream(source), win)
            return streamFromSubject(source.name(), sub) 
        },
    }
}

function initWindow<T>(source: Observable<T>, win: WindowingSystem<T>) {
    const sub = new Subject<T[]>()

    win.onStart((sub as unknown) as Subscriber<T[]>)

    source.subscribe({
        async next(event: T) {
            pushEventToWindow(event, win, sub)
        }
    })

    return sub
}

export async function pushEventToWindow<T>(event: T, window: WindowingSystem<T>, sub: Subject<T[]>) {
    const formattedEvent = window.formatEvent(event)
    await window.stateManager.enqueue(formattedEvent)
    startDequeueloop(sub, window)
}

/** Loop on stateManager's queue and dequeue events in order to process them one by one.
 * If called while there is another loop runnin, just returns leaving the queue untouched. */
export async function startDequeueloop<T>(sub: Subject<T[]>, win: WindowingSystem<T>) {
    if (win.isLooping) return
    win.isLooping = true

    while (!await win.stateManager.isQueueEmpty()) {
        const event = await win.stateManager.dequeue()
        await win.onDequeuedEvent((sub as unknown) as Subscriber<T[]>, event)
    }

    win.isLooping = false
}