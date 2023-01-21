import { onLostEvent, releaseEvents, Window, WindowOptions } from "./window"
import { Duration, toMs } from "../tools/duration"
import { StreamContext } from "../tools/stream"
import { MetaEvent } from "../tools/event"
import { Bucket, newBucket } from "./bucket"
import { Subject } from "rxjs"

export type TumblingWindow<E> = Window<E>

export type TumblingWindowOptions = WindowOptions & {
	size: Duration
}

export function tumblingWindow<E>(ctx: StreamContext, name: string, opts: TumblingWindowOptions, sub: Subject<MetaEvent<E[]>>): TumblingWindow<E> {
	const size = toMs(opts.size)
	const watermark = toMs(opts.watermark)

	let closedBuckets: Bucket[] = []
	let lastBucketTimestamp = Date.now()
	let currentBucket = newBucket(ctx, name, lastBucketTimestamp)

	setInterval(() => {
		lastBucketTimestamp += size 
		closedBuckets.push(currentBucket)

		currentBucket.close<E>(watermark, (events) => {
			releaseEvents(ctx, name, sub, events)
			closedBuckets = closedBuckets.filter(b => b.isDestroyed())
		}, lastBucketTimestamp)

		currentBucket = newBucket(ctx, name, lastBucketTimestamp)
	}, size)

	return {
		async pushEvent(event: MetaEvent<E>) {
			let assigned = false

			for (let bucket of closedBuckets) {
				if (bucket.ownsEvent(event)) {
					await bucket.push(event)
					assigned = true
					return
				}
			}

			if (currentBucket.ownsEvent(event)) {
				currentBucket.push(event)
				assigned = true
			}

			if (!assigned) onLostEvent(ctx, name, event)
		}
	}
}