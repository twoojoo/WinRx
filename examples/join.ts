import { Stream } from "../src";
import { EventEmitter } from "events"
import { redis } from "../src";
import Redis from "ioredis";

const emitter = new EventEmitter()
// const client = new Redis("redis://localhost:6379")

const stream2 = 
    Stream<number>("stream2", { logger: false })
        .fromEvent(emitter)
        .map(e => e.value)

Stream<number>("stream1", { logger: false })
    .fromEvent(emitter)
    .map(e => e.value)
    .join(stream2)
    .on((e1, e2) => e1 == e2)
    .tumblingWindow("tw1", { size: [2, "s"] })
    .apply((...args) => args.join(" - "))
    .toEvent(emitter, "test-result")

let counter1 = 0
setInterval(() => {
    emitter.emit("stream1", counter1)
    counter1 += 2
}, 50)

let counter2 = 0
setInterval(() => {
    emitter.emit("stream2", counter2)
    counter2++
}, 25)


emitter.on("test-result", (v) => console.log(v))