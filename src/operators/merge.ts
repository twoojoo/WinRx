import { streamFromSubject, subjectFromStream } from "../stream"
import { Stream } from "../stream";
import { Subject } from "rxjs"

type Mapper<T, R> = (event: T) => Promise<R> | R

export type Merge<T> = {
    /** Merge the current stream of type T with a stream of type R creating a stream which events are of type T | R */
    merge: <R>(stream: Stream<R>) => Stream<T | R>
    /** Merge the current stream of type T with a stream of type R and map both streams's event to different values*/
    mergeMap: <R, N, M>(
        stream: Stream<R>, 
        mapper1: Mapper<T, N>, 
        mapper2: Mapper<R, M>, 
    ) => Stream<N | M>
}

export function mergeFactory<T>(source: Stream<T>): Merge<T> {
    return {
        merge<R>(stream: Stream<R>): Stream<T | R> {
            const subj = new Subject<T | R>()

            subjectFromStream(source).subscribe({
                async next(event: T) {
                    subj.next(event)
                }
            })

            subjectFromStream(stream).subscribe({
                async next(event: R) {
                    subj.next(event)
                }
            })

            return streamFromSubject(source.name(), subj)
        },
        mergeMap<R, N, M>(
            stream: Stream<R>, 
            mapper1: Mapper<T, N>, 
            mapper2: Mapper<R, M>
        ): Stream<N | M> {
            const subj = new Subject<N | M>()

            subjectFromStream(source).subscribe({
                async next(event: T) {
                    subj.next(await mapper1(event))
                }
            })

            subjectFromStream(stream).subscribe({
                async next(event: R) {
                    subj.next(await mapper2(event))
                }
            })

            return streamFromSubject(source.name(), subj)
        },
    }
}