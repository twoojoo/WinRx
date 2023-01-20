import { randomUUID } from "node:crypto"

//properties of the internal event are arrays because,
//if winodw is applied to the stream, the result will
//be a single event containing the collection of windowed
//events as values.

export type MetaEvent<T> = {
	value: T,
	id: string[], 
	ingestionTime: number[],
}

export function makeMetaEvent<T>(event: T): MetaEvent<T> {
	return {
		value: event,
		id: [randomUUID()],
		ingestionTime: [Date.now()]
	}
}

export function parseIntenalEvent<T, R>(newEventValue: T, oldEvent: MetaEvent<R>): MetaEvent<T> {
	return { ...oldEvent, value: newEventValue }
}