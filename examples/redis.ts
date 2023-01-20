import { Stream, redis } from "../src/index";
import { EventEmitter } from "events"
import Redis from "ioredis";

const client = new Redis("redis://localhost:6379")

const emitter = new EventEmitter()

const stream2 = Stream("stream2", redis(client))
    .fromEvent<string>(emitter, "stream2")
    .map(e => e.value)

const stream1 = Stream("stream1", redis(client))
    .fromEvent<number>(emitter, "stream1")
    .withEventKey(e => "blblba")
    .map(e => e.value)
    .mergeMapSame(
        stream2,
        e1 => e1 * 10,
        e2 => parseInt(e2)
    )

stream1.toEvent(emitter, "test-result")

let counter1 = 0
setInterval(() => {
    emitter.emit("stream1", counter1)
    counter1 += 2
}, 500)

let counter2 = ""
setInterval(() => {
    emitter.emit("stream2", counter2)
    counter2 += "1"
}, 250)


emitter.on("test-result", (v) => console.log(v))