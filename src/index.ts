import { default as IORedisClient } from "ioredis"
import { Redis } from "./QueueManager"

export { stream } from "./sources"

export function redis(client: IORedisClient) {
    return new Redis(client)
}