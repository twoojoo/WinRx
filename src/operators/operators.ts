import { Observable, Subject } from "rxjs";
import { streamFromSubject } from "../utils/parseStream";
import { Stream } from "../types/Stream";

type OperatorCallback<T, R> = (event: T) => Promise<R> | R

export type Operators<T> = {
    map: <R>(callback: OperatorCallback<T, R>) => Stream<R>,
    forEach: (callback: OperatorCallback<T, void>) => Stream<T>,
    filter: (callback: OperatorCallback<T, boolean>) => Stream<T>
    // join: <R, N>(stream: Stream<R>) => Join<T, R, N>
}

export function operatorsFactory<T>(source: Observable<T>): Operators<T> {
    return {
        map<R>(callback: OperatorCallback<T, R>): Stream<R> {
            const subj = new Subject<R>()

            source.subscribe({
                async next(event: T) {
                    const result = await callback(event)
                    subj.next(result)
                }
            })

            return streamFromSubject(subj)
        },

        forEach(callback: OperatorCallback<T, void>): Stream<T> {
            const subj = new Subject<T>()

            source.subscribe({
                async next(event: T) {
                    await callback(event)
                    subj.next(event)
                }
            })

            return streamFromSubject(subj)
        },

        filter(callback: OperatorCallback<T, boolean>): Stream<T> {
            const subj = new Subject<T>()

            source.subscribe({
                async next(event: T) {
                    if (await callback(event)) {
                        subj.next(event)
                    }
                }
            })

            return streamFromSubject(subj)
        },
    }
}
