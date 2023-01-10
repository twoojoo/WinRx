import { Subject, Subscriber } from "rxjs"
import { WindowingSystem } from "../windows/models/WindowingSystem"
import { Stream } from "../stream";
import { streamFromSubject, subjectFromStream } from "../stream"
import { TumblingWindow, TumblingWindowOptions } from "../windows/windowingSystems"
import { pushEventToWindow } from "./windows"

export type Join<T> = {
    join: <R, N>(stream: Stream<R>) => JoinOperator<T, R, N>
}

type JoinOperator<T, R, N> = {
    on: (condition: JoinCondition<T, R>) => JoinWindows<T, R, N>
}

type JoinWindows<T, R, N> = {
    tumblingWindow: (options: TumblingWindowOptions<JoinEvent<T, R>>) => Apply<T, R>
}

type Apply<T, R> = {
    apply: <N>(operation: JoinOperation<T, R, N>) => Stream<N>
}

type JoinEvent<T, R> = (T | R)[]
type JoinCondition<T, R> = (event1: T, event2: R) => boolean
type JoinOperation<T, R, N> = (...args: (T | R)[]) => N


export function joinFactory<T>(source: Stream<T>): Join<T> {
    return {
        join<R, N>(stream: Stream<R>): JoinOperator<T, R, N> {
            return {
                on(condition: JoinCondition<T, R>): JoinWindows<T, R, N> {
                    return {
                        tumblingWindow(options: TumblingWindowOptions<JoinEvent<T, R>>): Apply<T, R> {
                            const window = new TumblingWindow<JoinEvent<T, R>>(options)
                            return applyFactory(source, stream, window, condition)
                        }
                    }
                }
            }
        }
    }
}

function applyFactory<T, R>(stream1: Stream<T>, stream2: Stream<R>, window: WindowingSystem<JoinEvent<T, R>>, condition: JoinCondition<T, R>): Apply<T, R> {
    return {
        apply<N>(operation: JoinOperation<T, R, N>): Stream<N> {
            const windowSub = new Subject<JoinEvent<T, R>[]>()

            window.onStart((windowSub as unknown) as Subscriber<JoinEvent<T, R>[]>)

            subjectFromStream(stream1).subscribe({
                async next(event: T) {
                    const tuple = [event, undefined]
                    await pushEventToWindow(tuple, window, windowSub)
                }
            });

            subjectFromStream(stream2).subscribe({
                async next(event: R) {
                    const tuple = [undefined, event]
                    await pushEventToWindow(tuple, window, windowSub)
                }
            })

            const finalSubject = new Subject<N>()
            windowSub.subscribe({
                next(eventsWindow: JoinEvent<T, R>[]) {
                    const events1: T[] = [], events2: R[] = []

                    eventsWindow.forEach(tuple => {
                        if (!tuple[0]) events2.push(tuple[1] as R)
                        else events1.push(tuple[0] as T)
                    })

                    { eventsWindow = null }

                    const matchedEvents: (T | R)[][] = []
                    for (let i = 0; i < events1.length; i++) {
                        const e1 = events1[i]
                        const matches = events2.filter(e2 => condition(e1, e2))
                        if (matches[0]) matchedEvents.push([e1, ...matches])
                    }

                    matchedEvents.forEach(matches => finalSubject.next(operation(...matches)))
                }
            })

            return streamFromSubject(finalSubject)
        }
    }
}