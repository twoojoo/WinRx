import { streamFromSubject, subjectFromStream } from "./Utils/parseStream"
import { Stream } from "./Types/Stream"
import { Subject } from "rxjs"

export type Merge<T> = {
    merge: <R>(stream: Stream<R>) => Stream<T | R> 
}

export function merge<T>(source: Stream<T>): Merge<T> {
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

            return streamFromSubject(subj)
        }
    }
}