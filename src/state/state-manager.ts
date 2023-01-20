import { randomUUID } from "crypto"
import { Subject } from "rxjs"
import { MetaEvent } from "../event"

export const StateManagerPool: { [streamName: string]: { [smName: string]: {} } } = {}

export abstract class StateManager<E> {
	private isLooping = false
	private name

	constructor(streamName: string, name?: string) {
		this.name = name || randomUUID()
		if (!StateManagerPool[streamName]) StateManagerPool[streamName] = {}
		StateManagerPool[streamName][this.name] = {}
	}

	abstract enqueueEvent(event: MetaEvent<E>): Promise<void>
	abstract dequeueEvent(): Promise<MetaEvent<E>>
	abstract isQueueEmpty(): Promise<boolean>

	async dequeueLoop(subject: Subject<MetaEvent<E>>) {
		if (this.isLooping) return
		this.isLooping = true

		while (!await this.isQueueEmpty()) {
			const event = await this.dequeueEvent()
			subject.next(event)
		}

		this.isLooping = false
	}

}