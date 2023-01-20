import { Subject } from "rxjs";
import { MetaEvent, parseIntenalEvent } from "../event";
import { streamFromSubject, subjectFromStream } from "../stream";
import { Stream } from "../stream";

type OperatorCallback<E, R> = (event: E) => Promise<R> | R

export type Operators<E> = {
    /**Transforms stream's events */
    map: <R>(callback: OperatorCallback<E, R>) => Stream<R>,
    /**Executes an action every time an event occurs without transforming the event*/
    forEach: (callback: OperatorCallback<E, void>) => Stream<E>,
    /**Filter events that match a contition*/
    filter: (callback: OperatorCallback<E, boolean>) => Stream<E>
}

export function operatorsFactory<E>(source: Stream<E>): Operators<E> {
    return {
        map<R>(callback: OperatorCallback<E, R>): Stream<R> {
            const subj = new Subject<MetaEvent<R>>()

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E>) {
                    const newValue = await callback(event.value) as R
                    subj.next(parseIntenalEvent(newValue, event))
                }
            })

            return streamFromSubject(source.name(), subj)
        },

        forEach(callback: OperatorCallback<E, void>): Stream<E> {
            const subj = new Subject<MetaEvent<E>>()

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E>) {
                    await callback(event.value)
                    subj.next(event)
                }
            })

            return streamFromSubject(source.name(), subj)
        },

        filter(callback: OperatorCallback<E, boolean>): Stream<E> {
            const subj = new Subject<MetaEvent<E>>()

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E>) {
                    if (await callback(event.value)) {
                        subj.next(event)
                    }
                }
            })

            return streamFromSubject(source.name(), subj)
        },
    }
}
