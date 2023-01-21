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
	

	const eventsByKey = {}
	events.forEach(e => {
		const key = e.metadata.key
		if (!eventsByKey[e.metadata.key]) eventsByKey[e.metadata.key] = []
		eventsByKey[e.metadata.key].push(e)
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
