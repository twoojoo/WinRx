import { EventEmitter } from "events"
import { OperatorFunction, Subject } from "rxjs"
import { InnerEvent } from "../event"
import { Join } from "../join"
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

export type Stream<T extends InnerEvent<any>> = 
    Omit<Subject<T>, RxJsSubjectOmissions> &
    Operators<T> &
    Windows<T> &
    Join<T> &
    Sinks<T>