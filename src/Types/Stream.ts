import { EventEmitter } from "events"
import { Subject } from "rxjs"

type RxJsSubjectOmissions = 'pipe'
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
type Flow<T> = (...args: any[]) => Stream<any>
type Join<T> = (...args: Stream<any>[]) => Stream<any>
type ToEvent<T> = (emitter: EventEmitter, name: string) => Stream<any>

export type Stream<T> = Omit<Subject<T>, RxJsSubjectOmissions> & {
    flow: Flow<T>
    join: Join<T>
    toEvent: ToEvent<T>
}