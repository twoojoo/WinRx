import { Subject } from "rxjs"
import { MetaEvent } from "../event"
import { Logger } from "../logger"
import { StreamContext } from "../stream"
import { Duration } from "../windows.old/types/Duration"
import { randomUUID } from "crypto"

export type WindowOptions = { watermark: Duration }

export type Window<E> = {
	onEvent: (event: MetaEvent<E>) => Promise<void>
}

export function onLostEvent<E>(ctx: StreamContext, windowName: string, event: MetaEvent<E>) {
	Logger(ctx).warning(`event lost in window "${windowName}" - key: ${event.metadata.key}`)
}

export function releaseEvents<E>(ctx: StreamContext, windowName: string, sub: Subject<MetaEvent<E[]>>, events: MetaEvent<E>[]) {
	Logger(ctx).info(`released bucket for window "${windowName}" - key: ${events[0].metadata.key} - size: ${events.length}`)
	sub.next(parseWindowedEvents(events))
}

function parseWindowedEvents<E>(events: MetaEvent<E>[]): MetaEvent<E[]> {
	const now = Date.now()

	return {
		metadata: {
			id: randomUUID(),
			key: events[0].metadata.key
		},
		tracking: {
			eventTime: now,
			ingestionTime: now,
			windows: {},
		},
		spec: events.map(e => e.spec)
	}
}