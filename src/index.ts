import {Redis, Memory} from "./windows/StateManagers"
import {default as IORedisClient} from "ioredis"
import { Duration } from "./windows/Types/Duration"

export { stream } from "./sources"

export function memory() {
    return new Memory()
}

export function redis(client: IORedisClient, TTL?: Duration) {
    return new Redis(client, TTL)
}