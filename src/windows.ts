import { Observable, Subject, Subscriber } from "rxjs";
import { streamFromSubject } from "./Utils/parseStream";
import { Stream } from "./Types/Stream";
import { TumblingWindow, TumblingWindowOptions } from "./WindowingSystems";
import { WindowingSystem } from "./Models/WindowingSystem";

export type Windows<T> = {
    tumblingWindow: (options: TumblingWindowOptions<T>) => Stream<T[]>
}

export function windows<T>(source: Observable<T>): Windows<T> {
    return {
        tumblingWindow(options: TumblingWindowOptions<T>): Stream<T[]> {
            const win = new TumblingWindow(options)
            const sub = initWindow(source, win)
            return streamFromSubject(sub) 
        }
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