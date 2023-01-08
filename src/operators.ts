import { Observable, Subject, Subscriber } from "rxjs";
import { streamFromSubject } from "./Utils/streamFromSubject";
import { Stream } from "./Types/Stream";
import { pushEventToWindow, startDequeueloop, Windows } from "./windows";
import { TumblingWindow, TumblingWindowOptions } from "./WindowingSystems";
import { WindowingSystem } from "./Models/WindowingSystem";

type OperatorCallback<T, R> = (event: T) => Promise<R> | R

export type Operators<T> = {
    map: <R>(callback: OperatorCallback<T, R>) => Stream<R>,
    forEach: (callback: OperatorCallback<T, void>) => Stream<T>,
    join: <R, N>(stream: Stream<R>) => Join<T, R, N>
}

export function operators<T>(source: Observable<T>): Operators<T> {
    return {
        map<R>(callback: OperatorCallback<T, R>): Stream<R> {
            const subj = new Subject()
            source.subscribe({
                async next(event: T) {
                    const result = await callback(event)
                    subj.next(result)
                }
            })

            return streamFromSubject(subj) as Stream<R>
        },

        forEach(callback: OperatorCallback<T, void>): Stream<T> {
            const subj = new Subject()
            source.subscribe({
                async next(event: T) {
                    await callback(event)
                    subj.next(event)
                }
            })

            return streamFromSubject(subj) as Stream<T>
        },

        join<R, N>(stream: Stream<R>): Join<T, R, N> {
            return {
                on(condition: JoinCondition<T, R>): JoinWindows<T, R, N> {
                    return {
                        tumblingWindow(options: TumblingWindowOptions<JoinEvent<T, R>>): Apply<T, R, N> {
                            const window = new TumblingWindow<JoinEvent<T, R>>(options)
                            return apply(source, (stream as unknown) as Observable<R>, window, condition)
                        }
                    }
                }
            }
        }
    }
}

function apply<T, R, N>(source1: Observable<T>, source2: Observable<R>, window: WindowingSystem<JoinEvent<T, R>>, condition: JoinCondition<T, R>): Apply<T, R, N> {
    return {
        apply(operation: JoinOperation<T, R, N>): Stream<N> {
            const sub = new Subject<JoinEvent<T, R>[]>()

            window.onStart((sub as unknown) as Subscriber<JoinEvent<T, R>[]>)

            source1.subscribe({
                async next(event: T) {
                    const tuple = [event, undefined]
                    await pushEventToWindow(tuple, window, sub)
                }
            })

            source2.subscribe({
                async next(event: R) {
                    const tuple = [undefined, event]
                    await pushEventToWindow(tuple, window, sub)
                }
            })

            const finalSubject = new Subject<N>()
            sub.subscribe({
                next(eventsWindow: JoinEvent<T, R>[]) {
                    const events1: T[] = [], events2: R[] = []

                    eventsWindow.forEach(tuple => {
                        if (!tuple[1]) events2.push(tuple[1] as R)
                        else events1.push(tuple[0] as T)
                    })

                    { eventsWindow = null }

                    const matchedEvents: (T | R)[] = []
                    for (let i = 0; i < events1.length; i++) {
                        const e1 = events1[i]
                        const matches = events2.filter(e2 => condition(e1, e2))
                        if (matches[0]) matchedEvents.push(e1, ...matches)
                    }

                    matchedEvents.forEach(matches => finalSubject.next(operation(matches)))
                }
            })

            return streamFromSubject(finalSubject)
        }
    }
}

type Join<T, R, N> = {
    on: (condition: JoinCondition<T, R>) => JoinWindows<T, R, N>
}

type JoinWindows<T, R, N> = {
    tumblingWindow: (options: TumblingWindowOptions<JoinEvent<T, R>>) => Apply<T, R, N>
}

type JoinEvent<T, R> = (T | R)[]

type JoinCondition<T, R> = (event1: T, event2: R) => boolean
type JoinOperation<T, R, N> = (...args: (T | R)[]) => N

type Apply<T, R, N> = {
    apply: (operation: JoinOperation<T, R, N>) => Stream<N>
}
