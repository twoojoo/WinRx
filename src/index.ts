import { Duration } from "./tools/duration"
import { newRedisStateManager } from "./state/redis"
import { default as RedisClient } from "ioredis"

export { Stream } from "./tools/stream"
export { Pool } from "./tools/pool"

export function redis(client: RedisClient, TTL?: Duration) {
    return newRedisStateManager(client, TTL)
}