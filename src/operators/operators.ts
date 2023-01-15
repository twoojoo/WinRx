import { Observable, Subject } from "rxjs";
import { streamFromSubject, subjectFromStream } from "../stream";
import { Stream } from "../stream";

type OperatorCallback<T, R> = (event: T) => Promise<R> | R

export type Operators<T> = {
    map: <R>(callback: OperatorCallback<T, R>) => Stream<R>,
    forEach: (callback: OperatorCallback<T, void>) => Stream<T>,
    filter: (callback: OperatorCallback<T, boolean>) => Stream<T>
}

export function operatorsFactory<T>(source: Stream<T>): Operators<T> {
    return {
        map<R>(callback: OperatorCallback<T, R>): Stream<R> {
            const subj = new Subject<R>()

            subjectFromStream(source).subscribe({
                async next(event: T) {
                    const result = await callback(event)
                    subj.next(result)
                }
            })

            return streamFromSubject(source.name(), subj)
        },

        forEach(callback: OperatorCallback<T, void>): Stream<T> {
            const subj = new Subject<T>()

            subjectFromStream(source).subscribe({
                async next(event: T) {
                    await callback(event)
                    subj.next(event)
                }
            })

            return streamFromSubject(source.name(), subj)
        },

        filter(callback: OperatorCallback<T, boolean>): Stream<T> {
            const subj = new Subject<T>()

            subjectFromStream(source).subscribe({
                async next(event: T) {
                    if (await callback(event)) {
                        subj.next(event)
                    }
                }
            })

            return streamFromSubject(source.name(), subj)
        },
    }
}
