import { Duration } from "./tools/duration"
import { newRedisStateManager } from "./state/redis"
import { default as RedisClient } from "ioredis"

//TOOLS
export { Stream } from "./tools/stream"
export { Pool } from "./tools/pool"

//STATE MANAGERS
export function redis(client: RedisClient, TTL?: Duration) {
    return newRedisStateManager(client, TTL)
}

//TYPES
export { StreamOptions } from "./tools/stream"
export { JoinOperation, JoinCondition } from "./operators/join"
export { OperatorCallback } from "./operators/operators"
export { Mapper } from "./operators/merge"
export { TumblingWindowOptions } from "./windows/tumblingWindow"