import { Subject, Subscriber } from "rxjs"
import { WindowingSystem } from "../windows/models/WindowingSystem"
import { Stream } from "../stream";
import { streamFromSubject, subjectFromStream } from "../stream"
import { TumblingWindow, TumblingWindowOptions } from "../windows/windowingSystems"
import { pushEventToWindow } from "./windows"
import { MetaEvent, parseIntenalEvent } from "../event";

export type Join<E1> = {
    /** Join the current stream with another stream*/
    join: <E2, R>(stream: Stream<E2>) => JoinOperator<E1, E2>
}

type JoinOperator<E1, E2> = {
    /**Provide a condition for the join operation*/
    on: (condition: JoinCondition<E1, E2>) => JoinWindows<E1, E2>
}

type JoinWindows<E1, E2> = {
    /**Set a tumbling window system for the join operation*/
    tumblingWindow: (options: TumblingWindowOptions<MetaEvent<JoinEvent<E1, E2>>>) => Apply<E1, E2>
}

type Apply<E1, E2> = {
    /**Apply a transformation to the joined events*/
    apply: <R>(operation: JoinOperation<E1, E2, R>) => Stream<R>
}

type JoinEvent<E1, E2> = (E1 | E2)[]
type JoinCondition<E1, E2> = (event1: E1, event2: E2) => boolean
type JoinOperation<E1, E2, R> = (...args: (E1 | E2)[]) => R


export function joinFactory<E1>(source: Stream<E1>): Join<E1> {
    return {
        join<E2>(stream: Stream<E2>): JoinOperator<E1, E2> {
            return {
                on(condition: JoinCondition<E1, E2>): JoinWindows<E1, E2> {
                    return {
                        tumblingWindow(options: TumblingWindowOptions<MetaEvent<JoinEvent<E1, E2>>>): Apply<E1, E2> {
                            const window = new TumblingWindow<MetaEvent<JoinEvent<E1, E2>>>(options)
                            return applyFactory(source, stream, window, condition)
                        }
                    }
                }
            }
        }
    }
}

function applyFactory<E1, E2>(stream1: Stream<E1>, stream2: Stream<E2>, window: WindowingSystem<MetaEvent<JoinEvent<E1, E2>>>, condition: JoinCondition<E1, E2>): Apply<E1, E2> {
    return {
        apply<N>(operation: JoinOperation<E1, E2, N>): Stream<N> {
            const windowSub = new Subject<MetaEvent<JoinEvent<E1, E2>>[]>()

            window.onStart((windowSub as unknown) as Subscriber<MetaEvent<JoinEvent<E1, E2>>[]>)

            subjectFromStream(stream1).subscribe({
                async next(event: MetaEvent<E1>) {
                    const tuple = parseIntenalEvent([event.spec, undefined], event)
                    await pushEventToWindow(tuple, window, windowSub)
                }
            });

            subjectFromStream(stream2).subscribe({
                async next(event: MetaEvent<E2>) {
                    const tuple = parseIntenalEvent([undefined, event.spec], event)
                    await pushEventToWindow(tuple, window, windowSub)
                }
            })

            const finalSubject = new Subject<MetaEvent<N>>()

            windowSub.subscribe({
                next(eventsWindow: MetaEvent<JoinEvent<E1, E2>>[]) {
                    const events1: E1[] = [], events2: E2[] = []

                    eventsWindow.forEach(e => {
                        const tuple = e.spec
                        if (!tuple[0]) events2.push(tuple[1] as E2)
                        else events1.push(tuple[0] as E1)
                    })

                    { eventsWindow = null }

                    const matchedEvents: (E1 | E2)[][] = []
                    for (let i = 0; i < events1.length; i++) {
                        const e1 = events1[i]
                        const matches = events2.filter(e2 => condition(e1, e2))
                        if (matches[0]) matchedEvents.push([e1, ...matches])
                    }

                    matchedEvents.forEach(matches => finalSubject.next(operation(...matches)))
                }
            })

            //merging two diferent ctx????
            return streamFromSubject(stream1.ctx, finalSubject)
        }
    }
}