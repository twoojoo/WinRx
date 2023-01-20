import { MetaEvent } from "../event";
import { StateManager } from "./state-manager";

export class MemoryStateManager<E> extends StateManager<E> {
	private mainQueue: MetaEvent<E>[] = []
	private buckets: { [winName: string]: { [bucketId: string]: MetaEvent<E>[] } } = {}

	constructor() {
		super()
	}

	async enqueueEvent(event: MetaEvent<E>) {
		this.mainQueue.push(event)
	}

	async dequeueEvent(): Promise<MetaEvent<E>> {
		return this.mainQueue.shift()
	}

	async isQueueEmpty(): Promise<boolean> {
		return this.mainQueue.length == 0
	}

	async push(windowName: string, event: MetaEvent<E>): Promise<void> {
		const bucketId = event.tracking.windows[windowName].bucketId
		if (!this.buckets[windowName]) this.buckets[windowName] = {}
		if (!this.buckets[windowName][bucketId]) this.buckets[windowName][bucketId] = []
		this.buckets[windowName][bucketId].push(event)
	}

	async flush(windowName: string, bucketId: string): Promise<MetaEvent<E>[]> {
		const events = this.buckets[windowName][bucketId]
		this.buckets[windowName][bucketId] = []
		return events
	}
}