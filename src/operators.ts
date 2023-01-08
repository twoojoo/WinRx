// // import { Stream } from "../Types/Stream"
// import { Observable, Subscriber, OperatorFunction } from "rxjs"

// import { Observable } from "rxjs";
import { Observable, Subject, Subscriber } from "rxjs";
import { streamFromSubject } from "./Utils/streamFromSubject";
import { Stream } from "./Types/Stream";

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
            const subj = new Subject()

            return {
                on(callback: JoinCallback<T, R, N>): Stream<N> {
                    const subj = new Subject<N>()
                    return streamFromSubject(subj)
                }
            }
        }
    }
}

type Join<T, R, N> = {
    on: (callback: JoinCallback<T, R, N>) => Stream<N>
}

type JoinCallback<T, R, N> = (event1: T, event2: R) => N
