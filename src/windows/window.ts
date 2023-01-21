import { Subject } from "rxjs"
import { MetaEvent } from "../tools/event"
import { Logger } from "../tools/logger"
import { StreamContext } from "../tools/stream"
import { Duration } from "../tools/duration"
import { randomUUID } from "crypto"

export type WindowOptions = { watermark: Duration }

export type Window<E> = {
	onEvent: (event: MetaEvent<E>) => Promise<void>
}

export function onLostEvent<E>(ctx: StreamContext, windowName: string, event: MetaEvent<E>) {
	Logger(ctx).warning(`event lost in window "${windowName}" - key: ${event.metadata.key}`)
}

export function releaseEvents<E>(ctx: StreamContext, windowName: string, sub: Subject<MetaEvent<E[]>>, events: MetaEvent<E>[]) {
	const eventsByKey = {}
	events.forEach(e => {
		const key = e.metadata.key
		if (!eventsByKey[key]) eventsByKey[key] = []
		eventsByKey[key].push(e)
	})

	for (const key in eventsByKey) {
		const now = Date.now()
		
		sub.next({
			metadata: {
				id: randomUUID(),
				key: eventsByKey[key][0].metadata.key
			},
			tracking: {
				eventTime: now,
				ingestionTime: now,
				windows: {},
			},
			spec: eventsByKey[key].map(e => e.spec)
		})

		Logger(ctx).info(`released bucket for window "${windowName}" - key: ${events[0].metadata.key} - size: ${events.length}`)
	}
}
