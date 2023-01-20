import { Redis, Memory } from "./windows/stateManagers"
import { default as IORedisClient } from "ioredis"
import { Duration } from "./windows/types/Duration"

export { Stream } from "./stream"
export { Pool } from "./pool"

// export function redis(opts: Omit<Redis>)

// export function memory() {
//     return new Memory()
// }

export function redis(client: IORedisClient, TTL?: Duration) {
    return new Redis(client, TTL)
}