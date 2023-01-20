import { randomUUID } from "node:crypto"

export type MetaEvent<E> = {
	metadata: {
		id: string, 
		key: string
	},
	tracking: {
		ingestionTime: number,
		eventTime: number,
		windows: {
			[windowName: string]: {
				ingestionTime: number
			}
		}
	}
	spec: E,
}

export function makeMetaEvent<E>(
	event: E, 
): MetaEvent<E> {
	return {
		metadata: {
			id: randomUUID(),
			key: "__default"
		},
		tracking: {
			ingestionTime: Date.now(),
			eventTime: undefined,
			windows: {}
		},
		spec: event,
	}
}

export function parseIntenalEvent<E, R>(newEventValue: E, oldEvent: MetaEvent<R>): MetaEvent<E> {
	return { ...oldEvent, spec: newEventValue }
}