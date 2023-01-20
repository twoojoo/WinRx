import { streamFromSubject, subjectFromStream } from "../stream"
import { Stream } from "../stream";
import { Subject } from "rxjs"
import { MetaEvent, parseIntenalEvent } from "../event";

type Mapper<E, R> = (event: E) => Promise<R> | R

export type Merge<E1> = {
    /** Merge the current stream of type T with a stream of type R creating a stream which events are of type T | R */
    merge: <E2>(stream: Stream<E2>) => Stream<E1 | E2>
    /** Merge the current stream of type T with a stream of type R and map both streams's event to different values*/
    mergeMap: <E2, R1, R2>(
        stream: Stream<E2>, 
        mapper1: Mapper<E1, R1>, 
        mapper2: Mapper<E2, R2>, 
    ) => Stream<R1 | R2>,
    /** Sintactic sugar for mergaMap that force the result of both mapper functions to be of the same type*/
    mergeMapSame: <E2, R>(
        stream: Stream<E2>, 
        mapper1: Mapper<E1, R>, 
        mapper2: Mapper<E2, R>, 
    ) => Stream<R>
}

export function mergeFactory<E1>(source: Stream<E1>): Merge<E1> {
    return {
        merge<E2>(stream: Stream<E2>): Stream<E1 | E2> {
            const subj = new Subject<MetaEvent<E1 | E2>>()

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E1>) {
                    subj.next(event)
                }
            })

            subjectFromStream(stream).subscribe({
                async next(event: MetaEvent<E2>) {
                    subj.next(event)
                }
            })

            return streamFromSubject(source.name(), subj)
        },
        mergeMap<E2, R1, R2>(
            stream: Stream<E2>, 
            mapper1: Mapper<E1, R1>, 
            mapper2: Mapper<E2, R2>, 
        ): Stream<R1 | R2> {
            const subj = new Subject<MetaEvent<R1 | R2>>()

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E1>) {
                    const newValue = await mapper1(event.value) as R1
                    subj.next(parseIntenalEvent(newValue, event))
                }
            })

            subjectFromStream(stream).subscribe({
                async next(event: MetaEvent<E2>) {
                    const newValue = await mapper2(event.value) as R2
                    subj.next(parseIntenalEvent(newValue, event))
                }
            })

            return streamFromSubject(source.name(), subj)
        },

        mergeMapSame<E2, R>(
            stream: Stream<E2>, 
            mapper1: Mapper<E1, R>, 
            mapper2: Mapper<E2, R>, 
        ): Stream<R> {
            const subj = new Subject<MetaEvent<R>>()

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E1>) {
                    const newValue = await mapper1(event.value) as R
                    subj.next(parseIntenalEvent(newValue, event))
                }
            })

            subjectFromStream(stream).subscribe({
                async next(event: MetaEvent<E2>) {
                    const newValue = await mapper2(event.value) as R
                    subj.next(parseIntenalEvent(newValue, event))
                }
            })

            return streamFromSubject(source.name(), subj)
        },
    }
}