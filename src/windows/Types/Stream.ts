import { Subject } from "rxjs"
import { Join } from "../../operators/join"
import { Merge } from "../../operators/merge"
import { Operators } from "../../operators/operators"
import { Sinks } from "../../sinks"
import { Windows } from "../../operators/windows"

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