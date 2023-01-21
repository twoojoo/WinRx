import { streamFromSubject, subjectFromStream } from "../tools/stream";
import { MetaEvent, parseIntenalEvent } from "../tools/event";
import { Stream } from "../tools/stream";
import { Subject } from "rxjs";

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
                    const newValue = await callback(event.spec) as R
                    subj.next(parseIntenalEvent(newValue, event))
                }
            })

            return streamFromSubject(source.ctx, subj)
        },

        forEach(callback: OperatorCallback<E, void>): Stream<E> {
            const subj = new Subject<MetaEvent<E>>()

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E>) {
                    await callback(event.spec)
                    subj.next(event)
                }
            })

            return streamFromSubject(source.ctx, subj)
        },

        filter(callback: OperatorCallback<E, boolean>): Stream<E> {
            const subj = new Subject<MetaEvent<E>>()

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E>) {
                    if (await callback(event.spec)) {
                        subj.next(event)
                    }
                }
            })

            return streamFromSubject(source.ctx, subj)
        },
    }
}
