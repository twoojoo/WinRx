import { streamFromSubject, subjectFromStream } from "../tools/stream"
import { MetaEvent, parseIntenalEvent } from "../tools/event";
import { Stream } from "../tools/stream";
import { Subject } from "rxjs"

export type Mapper<E, R> = (event: E) => Promise<R> | R

export type Merge<E1> = {
    /** Merge the current stream of type T with a stream of type R creating a stream which events are of type T | R */
    merge: <E2>(stream: Stream<E2>) => Stream<E1 | E2>

    /** [Typescript] Sintactic sugar for the merge operator that force the imput events to be of the same type*/
    mergeSame: (stream: Stream<E1>) => Stream<E1>

    /** Merge the current stream of type T with a stream of type R and map both streams's event to different values*/
    mergeMap: <E2, R1, R2>(
        stream: Stream<E2>, 
        mapper1: Mapper<E1, R1>, 
        mapper2: Mapper<E2, R2>, 
    ) => Stream<R1 | R2>,

    /** [Typescript] Sintactic sugar for the mergeMap operator that force the imput events to be of the same type*/
    mergeSameMap: <R>(
        stream: Stream<E1>,
        mapper: Mapper<E1, R>
    ) => Stream<R>

    /** [Typescript] Sintactic sugar for the mergeMap operator that force the result of both mapper functions to be of the same type*/
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

            return streamFromSubject(source.ctx, subj)
        },
        
        mergeSame(stream: Stream<E1>): Stream<E1> {
            const subj = new Subject<MetaEvent<E1>>()

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E1>) {
                    subj.next(event)
                }
            })

            subjectFromStream(stream).subscribe({
                async next(event: MetaEvent<E1>) {
                    subj.next(event)
                }
            })

            return streamFromSubject(source.ctx, subj)
        },

        mergeMap<E2, R1, R2>(
            stream: Stream<E2>, 
            mapper1: Mapper<E1, R1>, 
            mapper2: Mapper<E2, R2>, 
        ): Stream<R1 | R2> {
            const subj = new Subject<MetaEvent<R1 | R2>>()

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E1>) {
                    const newValue = await mapper1(event.spec) as R1
                    subj.next(parseIntenalEvent(newValue, event))
                }
            })

            subjectFromStream(stream).subscribe({
                async next(event: MetaEvent<E2>) {
                    const newValue = await mapper2(event.spec) as R2
                    subj.next(parseIntenalEvent(newValue, event))
                }
            })

            return streamFromSubject(source.ctx, subj)
        },

        mergeSameMap<R>(
            stream: Stream<E1>, 
            mapper: Mapper<E1, R>,
        ): Stream<R> {
            const subj = new Subject<MetaEvent<R>>()

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E1>) {
                    const newValue = await mapper(event.spec) as R
                    subj.next(parseIntenalEvent(newValue, event))
                }
            })

            subjectFromStream(stream).subscribe({
                async next(event: MetaEvent<E1>) {
                    const newValue = await mapper(event.spec) as R
                    subj.next(parseIntenalEvent(newValue, event))
                }
            })

            return streamFromSubject(source.ctx, subj)
        },

        mergeMapSame<E2, R>(
            stream: Stream<E2>, 
            mapper1: Mapper<E1, R>, 
            mapper2: Mapper<E2, R>, 
        ): Stream<R> {
            const subj = new Subject<MetaEvent<R>>()

            subjectFromStream(source).subscribe({
                async next(event: MetaEvent<E1>) {
                    const newValue = await mapper1(event.spec) as R
                    subj.next(parseIntenalEvent(newValue, event))
                }
            })

            subjectFromStream(stream).subscribe({
                async next(event: MetaEvent<E2>) {
                    const newValue = await mapper2(event.spec) as R
                    subj.next(parseIntenalEvent(newValue, event))
                }
            })

            return streamFromSubject(source.ctx, subj)
        },
    }
}