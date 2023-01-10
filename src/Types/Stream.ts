import { Subject } from "rxjs"
import { Join } from "../join"
import { Merge } from "../merge"
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

export type Stream<T> = 
    Omit<Subject<T>, RxJsSubjectOmissions> &
    Operators<T> &
    Windows<T> &
    Join<T> &
    Merge<T> &
    Sinks<T>