import { Observable, Subject } from "rxjs";
import { streamFromSubject } from "./Utils/parseStream";
import { Stream } from "./Types/Stream";
import { InnerEvent } from "./event";

type OperatorCallback<T, R> = (event: T) => Promise<R> | R

export type Operators<T> = {
    map: <R>(callback: OperatorCallback<T, R>) => Stream<InnerEvent<R>>,
    forEach: (callback: OperatorCallback<T, void>) => Stream<InnerEvent<T>>,
    filter: (callback: OperatorCallback<T, boolean>) => Stream<InnerEvent<T>>
}

export function operators<T>(source: Observable<InnerEvent<T>>): Operators<T> {
    return {
        map<R>(callback: OperatorCallback<T, R>): Stream<InnerEvent<R>> {
            const subj = new Subject<InnerEvent<R>>()

            source.subscribe({
                async next(event: InnerEvent<T>) {
                    const result: InnerEvent<R> = {...event, value: await callback(event.value)} 
                    subj.next(result)
                }
            })

            return streamFromSubject(subj)
        },

        forEach(callback: OperatorCallback<T, void>): Stream<InnerEvent<T>> {
            const subj = new Subject<InnerEvent<T>>()

            source.subscribe({
                async next(event: InnerEvent<T>) {
                    await callback(event.value)
                    subj.next(event)
                }
            })

            return streamFromSubject(subj)
        },

        filter(callback: OperatorCallback<T, boolean>): Stream<InnerEvent<T>> {
            const subj = new Subject<InnerEvent<T>>()

            source.subscribe({
                async next(event: InnerEvent<T>) {
                    if (await callback(event.value)) {
                        subj.next(event)
                    }
                }
            })

            return streamFromSubject(subj)
        },
    }
}
