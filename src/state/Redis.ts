import { MetaEvent } from "../event";
import { StateManager } from "./state-manager";
import { default as RedisClient } from "ioredis"
import { Duration } from "dayjs/plugin/duration";

export class RedisStateManager<E> extends StateManager<E> {
	private redisClient: RedisClient
	// private windowQueueKeyPrefix = 'window-queue-'

	constructor(client: RedisClient, TTL?: Duration) {
		super()
		this.redisClient = client
		// this.TTL = toMs(TTL)
	}

	private mainQueueKey() {
		return "main-queue-" + this.streamName
	} 

	async enqueueEvent(event: MetaEvent<E>) {
		await this.redisClient.xadd(this.mainQueueKey(), '*', "message", JSON.stringify(event))
	}

	async dequeueEvent(): Promise<MetaEvent<E>> {
		const value = await this.redisClient.xread("COUNT", 1, "STREAMS", this.mainQueueKey(), "0")
		const redisId = value[0][1][0][0]
		const event: MetaEvent<E> = JSON.parse(value[0][1][0][1][1])
		await this.redisClient.xdel(this.mainQueueKey(), redisId)
		return event
	}

	async isQueueEmpty(): Promise<boolean> {
		try {
			const info: any[] = (await this.redisClient.xinfo("STREAM", this.mainQueueKey()) as any[])
			const length = info[info.indexOf("length") + 1]
			return length == 0
		} catch (err) {
			if (err.message == "ERR no such key") return true
			else throw err
		}
	}
}