import { EventEmitter } from "events"
import { OperatorFunction, Subject } from "rxjs"
import { Operators } from "../operators"
import { Sinks } from "../sinks"
import { Windows } from "../windows"

type RxJsSubjectOmissions = //'pipe'
    | 'complete'
    | 'error'
    | 'asObservable'
    | 'forEach'
    | 'subscribe'
    | 'unsubscribe'
    | 'hasError'
    | 'isStopped'
    | 'lift'
    | 'operator'
    | 'source'
    | 'thrownError'
    | 'toPromise'
    | 'observers'
    | 'observed'
    | 'next'
    | 'closed'

//Stream "methods"
// type Flow<T> = <R>(...args: OperatorFunction<T, any>[]) => Stream<R>
// type Join<T> = (...args: Stream<any>[]) => Stream<any>
// type ToEvent<T> = (emitter: EventEmitter, name: string) => Stream<any>

export type Stream<T> = 
    Omit<Subject<T>, RxJsSubjectOmissions> &
    Operators<T> &
    Windows<T> &
    Sinks<T>