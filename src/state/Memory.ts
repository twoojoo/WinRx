import { MetaEvent } from "../event";
import { StateManager } from "./state-manager";

export class MemoryStateManager<E> extends StateManager<E> {
	private mainQueue = []

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
}