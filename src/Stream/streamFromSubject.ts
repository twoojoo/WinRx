import { Subject } from "rxjs";
import { EventEmitter } from "events"
import { Stream } from "../Types/Stream";

/** This function is more or less sintactic sugar to trasnform an RXJS subject into a WinRx Stream */
export function streamFromSubject<T>(subj: Subject<T>): Stream<T> {
    const stream = <Stream<T> & {
        pipe: any,
        subscribe: any
    }>(subj as unknown)

    stream.flow = (...args: any[]) => {
        const newSubj = (stream).pipe(...args)
        return streamFromSubject(newSubj)
    }

    stream.toEvent = (emitter: EventEmitter, name: string) => {
        const newSubj = new Subject()
        stream.subscribe(event => {
            emitter.emit(name, event)
            newSubj.next(event)
        })
        return streamFromSubject(newSubj)
    }

    return stream as Stream<T>
}