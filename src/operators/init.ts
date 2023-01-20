import { Subject } from "rxjs"
import { MetaEvent } from "../event"
import { Stream, streamFromSubject, subjectFromStream } from "../stream"

export type EventKeyExtractor<E> = (event: E) => number | string
export type EventTimeExtractor<E> = (event: E) => number | string

export type Init<E> = {
	/**Set an event key to be used by the windowing systems*/
	withEventKey: (extractor: EventKeyExtractor<E>) => Stream<E>,
	/**Set an event time to be used by the windowing systems*/
	withEventTime: (extractor: EventTimeExtractor<E>) => Stream<E>
}

export function initFactory<E>(source: Stream<E>): Init<E> {
	return {
		withEventKey(extractor: EventKeyExtractor<E>): Stream<E> {
			const subj = new Subject<MetaEvent<E>>()

			subjectFromStream(source).subscribe({
				async next(event: MetaEvent<E>) {
					event.metadata.key = extractor(event.spec).toString()
					subj.next(event)
				}
			})

			return streamFromSubject(source.ctx, subj)
		},
		 
		withEventTime(extractor: EventTimeExtractor<E>): Stream<E> {
			const subj = new Subject<MetaEvent<E>>()

			subjectFromStream(source).subscribe({
				async next(event: MetaEvent<E>) {
					event.tracking.eventTime = new Date(extractor(event.spec)).getTime()
					subj.next(event)
				}
			})

			return streamFromSubject(source.ctx, subj)
		}
	}
}