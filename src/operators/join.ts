// import { TumblingWindow, TumblingWindowOptions } from "../windows/windowingSystems"
// import { WindowingSystem } from "../windows/models/WindowingSystem"
import { streamFromSubject, subjectFromStream } from "../tools/stream"
import { MetaEvent, parseIntenalEvent } from "../tools/event";
import { randomUUID } from "crypto"
import { tumblingWindow, TumblingWindowOptions } from "../windows/tumblingWindow"
import { Subject } from "rxjs"
import { Stream } from "../tools/stream";
import { Window } from "../windows/window";

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
    tumblingWindow: (name: string, options: TumblingWindowOptions) => Apply<E1, E2>
}

type Apply<E1, E2> = {
    /**Apply a transformation to the joined events*/
    apply: <R>(operation: JoinOperation<E1, E2, R>) => Stream<R>
}

type JoinEvent<E1, E2> = (E1 | E2)[]
export type JoinCondition<E1, E2> = (event1: E1, event2: E2) => boolean
export type JoinOperation<E1, E2, R> = (...args: (E1 | E2)[]) => R


export function joinFactory<E1>(source: Stream<E1>): Join<E1> {
    return {
        join<E2>(stream: Stream<E2>): JoinOperator<E1, E2> {
            return {
                on(condition: JoinCondition<E1, E2>): JoinWindows<E1, E2> {
                    return {
                        tumblingWindow(name: string, options: TumblingWindowOptions): Apply<E1, E2> {
                            const windowSub = init<E1, E2>(name, source)//new Subject<MetaEvent<JoinEvent<E1, E2>[]>>()
                            const window = tumblingWindow<JoinEvent<E1, E2>>(source.ctx, name, options, windowSub)
                            return applyFactory(name, source, stream, window, windowSub, condition)
                        }
                    }
                }
            }
        }
    }
}

function applyFactory<E1, E2>(windowName: string, stream1: Stream<E1>, stream2: Stream<E2>, window: Window<JoinEvent<E1, E2>>, windowSub: Subject<MetaEvent<JoinEvent<E1, E2>[]>>, condition: JoinCondition<E1, E2>): Apply<E1, E2> {
    return {
        apply<N>(operation: JoinOperation<E1, E2, N>): Stream<N> {

            subjectFromStream(stream1).subscribe({
                async next(event: MetaEvent<E1>) {
                    const tuple = parseIntenalEvent([event.spec, undefined], event)
                    tuple.tracking.windows[windowName] = {ingestionTime: Date.now()}
                    await window.pushEvent(tuple)
                }
            });

            subjectFromStream(stream2).subscribe({
                async next(event: MetaEvent<E2>) {
                    const tuple = parseIntenalEvent([undefined, event.spec], event)
                    tuple.tracking.windows[windowName] = {ingestionTime: Date.now()}
                    await window.pushEvent(tuple)
                }
            })

            const applySubject = new Subject<MetaEvent<N>>()

            windowSub.subscribe({
                next(eventsWindow: MetaEvent<JoinEvent<E1, E2>[]>) {
                    const key = eventsWindow.metadata.key
                    const now = Date.now()

                    const events1: E1[] = [], events2: E2[] = []

                    eventsWindow.spec.forEach(e => {
                        const tuple = e
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

                    matchedEvents.forEach(matches => applySubject.next({
                        metadata: {
                            id: randomUUID(),
                            key,
                        },
                        tracking: {
                            windows: {},
                            eventTime: now,
                            ingestionTime: now
                        },
                        spec: operation(...matches)
                    }))
                }
            })

            //context is inherited by the caller stream
            return streamFromSubject(stream1.ctx, applySubject)
        }
    }
}

function init<E1, E2>(name: string, source: Stream<E1>): Subject<MetaEvent<JoinEvent<E1, E2>[]>> {
    if (source.ctx.windows.includes(name)) throw Error(`a window named "${name}" already exists for stream "${source.name()}"`)
    source.ctx.windows.push(name)
    return new Subject<MetaEvent<JoinEvent<E1, E2>[]>>()
}



