import { MetaEvent } from "../event";
import { newBaseStateManager, StateManager } from "./state-manager";

export type MemoryStateManager<E> = StateManager<E>

export function newMemoryStateManager<E>(): MemoryStateManager<E> {
	const baseSm = newBaseStateManager()

	const mainQueue: MetaEvent<E>[] = []
	const buckets: { [winName: string]: { [bucketId: string]: MetaEvent<E>[] } } = {}

	return {
		...baseSm,

		async enqueueEvent(event: MetaEvent<E>) {
			mainQueue.push(event)
		},

		async dequeueEvent(): Promise<MetaEvent<E>> {
			return mainQueue.shift()
		},

		async isQueueEmpty(): Promise<boolean> {
			return mainQueue.length == 0
		},

		async push(windowName: string, event: MetaEvent<E>): Promise<void> {
			const bucketId = event.tracking.windows[windowName].bucketId
			if (!buckets[windowName]) buckets[windowName] = {}
			if (!buckets[windowName][bucketId]) buckets[windowName][bucketId] = []
			buckets[windowName][bucketId].push(event)
		},

		async flush(windowName: string, bucketId: string): Promise<MetaEvent<E>[]> {
			const events = buckets[windowName][bucketId]
			buckets[windowName][bucketId] = []
			return events
		}
	}
}