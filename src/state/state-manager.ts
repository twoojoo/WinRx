import { Subject } from "rxjs"
import { MetaEvent } from "../event"

/**The state manager handles stream queues, window queues and window buckets by providing an common interface to store events in different storage types.*/
export abstract class StateManager<E> {
	streamName: string
	private isLooping = false
	// private isLoopingByWindow: { [winName: string]: boolean } = {}
	// private name: string

	setStreamName(name: string) {
		this.streamName = name
	}

	//MAIN QUEUE
	abstract enqueueEvent(event: MetaEvent<E>): Promise<void>
	abstract dequeueEvent(): Promise<MetaEvent<E>>
	abstract isQueueEmpty(): Promise<boolean>

	//MAIN DEQUEUING LOOP
	/**every new event trigger this function that will loop through the queue dequeing events one by one.
	 * If this method is already lopping when an event arrives, nothing will happen*/
	async dequeueLoop(subject: Subject<MetaEvent<E>>) {
		if (this.isLooping) return
		this.isLooping = true

		while (!await this.isQueueEmpty()) {
			const event = await this.dequeueEvent()
			subject.next(event)
		}

		this.isLooping = false
	} 

	//WINDOW QUEUE
	// abstract enqueueWindowEvent(windowName: string, event: MetaEvent<E>): Promise<void>
	// abstract dequeueWindowEvent(windowName: string): Promise<MetaEvent<E>>
	// abstract isWindowQueueEmpty(windowName: string): Promise<boolean>

	// //WINDOW DEQUEUING LOOP
	// async dequeueLoopWindow(windowName: string, subject: Subject<MetaEvent<E>>) {
	// 	if (this.isLoopingByWindow[windowName]) return
	// 	this.isLoopingByWindow[windowName] = true

	// 	while (!await this.isWindowQueueEmpty(windowName)) {
	// 		const event = await this.dequeueWindowEvent(windowName)
	// 		subject.next(event)
	// 	}

	// 	this.isLoopingByWindow[windowName] = false
	// } 

	// //WINDOW BUCKETS METHODS
	// abstract push(event: MetaEvent<E>): Promise<void>
	// abstract flush(bucketId: string): Promise<MetaEvent<E>[]>
	// abstract get(bucketId: string): Promise<MetaEvent<E>[]>
	// abstract clear(bucketId: string): Promise<void>
}