import { Subject } from "rxjs";
import { Stream } from "../Types/Stream";
import { sinks } from "../sinks";
import { operators } from "../operators";
import { windows } from "../windows";
import { join } from "../join";
import { InnerEvent } from "../event";

/** Converts an RXJS subject into a WinRx Stream */
export function streamFromSubject<T extends InnerEvent<any>>(subj: Subject<T>): Stream<T> {
    const stream = subj as any

    Object.assign(
        stream,
        sinks<T>(stream),
        windows<T>(stream),
        join<T>(stream),
        operators<T>(stream)
    )

    return stream as Stream<T>
}

/** Just Typescript sintactic sugar to parse a Stream into a Subject */
export function subjectFromStream<T extends InnerEvent<any>>(stream: Stream<T>) {
    return (stream as unknown) as Subject<T>
}