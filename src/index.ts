import { Duration } from "./windows.old/types/Duration"
import { newRedisStateManager } from "./state/redis"
import { default as RedisClient } from "ioredis"

export { Stream } from "./stream"
export { Pool } from "./pool"

export function redis(client: RedisClient, TTL?: Duration) {
    return newRedisStateManager(client, TTL)
}