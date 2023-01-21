import { Stream } from "../src";
import { EventEmitter } from "events"
import { redis } from "../src";
import Redis from "ioredis";

const emitter = new EventEmitter()
const client = new Redis("redis://localhost:6379")

const stream2 = Stream<number>("stream2")
    .fromEvent(emitter, "stream2")
    .map(e => e.value)

const stream1 = Stream<number>("stream1")
    .fromEvent(emitter, "stream1")
    .map(e => e.value)
    .join(stream2)
    .on((e1, e2) => e1 == e2)
    .tumblingWindow("tw1", { size: [2, "seconds"] })
    .apply((...args) => args.join(" - "))

stream1.toEvent(emitter, "test-result")

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