import { timestamp } from "rxjs"
import { MetaEvent } from "../event"
import { StreamContext } from "../stream"

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

	function destroy() {
		destroyedAt = Date.now()
	}

	function isDestroyed() {
		return !!destroyedAt
	}

	function isClosed() {
		return !!closedAt
	}

	return {
		isDestroyed() {
			return !!destroyedAt
		},

		isClosed() {
			return !!closedAt
		},

		isAfterEvent<E>(event: MetaEvent<E>) {
			const eTime = getTimeFromEvent(windowName, event)
			return openedAt > eTime
		},

		ownsEvent<E>(event: MetaEvent<E>): boolean {
			if (isDestroyed()) return false
			const eTime = getTimeFromEvent(windowName, event)
			if (isClosed()) return eTime >= openedAt && eTime < closedAt
			else return eTime >= openedAt
		},

		async push<E>(event: MetaEvent<E>): Promise<void> {
			event.tracking.windows[windowName].bucketId = id
			await ctx.stateManager.push(windowName, event)
		},

		async close<E>(watermark: number, callback: (events: MetaEvent<E>[]) => void, timestamp: number = Date.now()) {
			closedAt = timestamp
        
			setTimeout(async () => {
				destroy()
				callback(await flush())
			}, watermark)
		}
	}
}

function getTimeFromEvent<E>(windowName: string, event: MetaEvent<E>): number {
	return event.tracking.eventTime || event.tracking.windows[windowName].ingestionTime || event.tracking.ingestionTime
}