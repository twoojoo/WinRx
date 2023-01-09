import {Redis, Memory} from "./StateManagers"
import {default as IORedisClient} from "ioredis"
import { Duration } from "./Types/Duration"

export { stream } from "./sources"

export function memory() {
    return new Memory()
}

export function redis(client: IORedisClient, TTL?: Duration) {
    return new Redis(client, TTL)
}