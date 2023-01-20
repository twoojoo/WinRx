import { randomUUID } from "node:crypto"

/**Wrapper type of the stream event containing metadata and tracking info*/
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
				bucketId?: string 
			}
		}
	}
	spec: E,
}

/**Build a new MetaEvent from an incoming event*/
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

/**Parse a MetaEvent into a new MetaEvent with a different event type*/
export function parseIntenalEvent<E, R>(newEventValue: E, oldEvent: MetaEvent<R>): MetaEvent<E> {
	return { ...oldEvent, spec: newEventValue }
}