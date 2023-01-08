import { Subject } from "rxjs";
import { EventEmitter } from "events"
import { Stream } from "../Types/Stream";

/** This function is more or less sintactic sugar to trasnform an RXJS subject into a WinRx Stream */
export function streamFromSubject<T>(subj: Subject<T>): Stream<T> {
    const stream = <Stream<T> & {
        pipe: any,
        subscribe: any
    }>(subj as unknown)
    
    return stream as Stream<T>
}