import { Subject } from "rxjs";
import { Stream } from "../stream";
import { sinksFactory } from "../operators/sinks";
import { operatorsFactory } from "../operators/operators";
import { windowsFactory } from "../operators/windows";
import { joinFactory } from "../operators/join";
import { mergeFactory } from "../operators/merge";

/** Converts an RXJS subject into a WinRx Stream */
export function streamFromSubject<T>(subj: Subject<T>): Stream<T> {
    const stream = subj as any

    Object.assign(
        stream,
        sinksFactory<T>(stream),
        windowsFactory<T>(stream),
        joinFactory<T>(stream),
        mergeFactory<T>(stream),
        operatorsFactory<T>(stream)
    )

    return stream as Stream<T>
}

/** Just Typescript sintactic sugar to parse a Stream into a Subject */
export function subjectFromStream<T>(stream: Stream<T>) {
    return (stream as unknown) as Subject<T>
}