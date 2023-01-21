import { timestamp } from "rxjs"
import { MetaEvent } from "../tools/event"
import { StreamContext } from "../tools/stream"

export type Bucket = {
	isDestroyed: () => boolean,
	isClosed: () => boolean,
	isAfterEvent: <E>(event: MetaEvent<E>) => boolean,
	ownsEvent: <E>(event: MetaEvent<E>) => boolean,
	push: <E>(event: MetaEvent<E>) => Promise<void>,
	close: <E>(
		watermark: number,
		callback: (events: MetaEvent<E>[]) => void, 
		timestamp?: number
	) => Promise<void>
}

export function newBucket(ctx: StreamContext, windowName: string, openedAt: number = Date.now()): Bucket {
	const id = "__" + timestamp

	let closedAt: number = undefined
	let destroyedAt: number = undefined

	async function flush<E>(): Promise<MetaEvent<E>[]> {
		return await ctx.stateManager.flush(windowName, id)
	}

	const self = {
		destroy() {
			destroyedAt = Date.now()
		},

		isDestroyed() {
			return !!destroyedAt
		},

		isClosed() {
			return !!closedAt
		}
	}

	return {
		...self,

		isAfterEvent<E>(event: MetaEvent<E>) {
			const eTime = getTimeFromEvent(windowName, event)
			return openedAt > eTime
		},

		ownsEvent<E>(event: MetaEvent<E>): boolean {
			if (self.isDestroyed()) return false
			const eTime = getTimeFromEvent(windowName, event)
			if (self.isClosed()) return eTime >= openedAt && eTime < closedAt
			else return eTime >= openedAt
		},

		async push<E>(event: MetaEvent<E>): Promise<void> {
			event.tracking.windows[windowName].bucketId = id
			await ctx.stateManager.push(windowName, event)
		},

		async close<E>(watermark: number, callback: (events: MetaEvent<E>[]) => void, timestamp: number = Date.now()) {
			closedAt = timestamp
        
			setTimeout(async () => {
				self.destroy()
				callback(await flush())
			}, watermark)
		}
	}
}

function getTimeFromEvent<E>(windowName: string, event: MetaEvent<E>): number {
	return event.tracking.eventTime || event.tracking.windows[windowName].ingestionTime || event.tracking.ingestionTime
}