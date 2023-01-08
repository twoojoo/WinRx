import { Subject } from "rxjs";
import { Stream } from "../Types/Stream";
import { sinks } from "../sinks";
import { operators } from "../operators";
import { windows } from "../windows";

/** This function is more or less sintactic sugar to trasnform an RXJS subject into a WinRx Stream */
export function streamFromSubject<T>(subj: Subject<T>): Stream<T> {
    const stream = subj as any

    Object.assign(
        stream,
        sinks<T>(stream),
        windows<T>(stream),
        operators<T>(stream)
    )

    return stream as Stream<T>
}