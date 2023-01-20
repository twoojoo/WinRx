import { Duration } from "./windows/types/Duration"
import { RedisStateManager } from "./state/Redis"
import { default as RedisClient } from "ioredis"

export { Stream } from "./stream"
export { Pool } from "./pool"

export function redis(client: RedisClient, TTL?: Duration) {
    return new RedisStateManager(client, TTL)
}