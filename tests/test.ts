import { stream } from "../src/sources";
import { EventEmitter } from "events"
import { redis } from "../src";
import Redis from "ioredis";

const emitter = new EventEmitter()
const client = new Redis("redis://localhost:6379")

const stream2 = stream("stream2", redis(client))
    .fromEvent<number>(emitter, "stream2")
    .map(e => e.value)

const stream1 = stream("stream1", redis(client))
    .fromEvent<number>(emitter, "stream1")
    .map(e => e.value)
    .join(stream2)
    .on((e1, e2) => e1 == e2)
    .tumblingWindow({ size: 2000 })
    .apply((...args) => args.join(" - "))
    
stream1.toEvent(emitter, "test-result")

let counter1 = 0
setInterval(() => {
    emitter.emit("stream1", counter1)
    counter1 += 2
}, 500)

let counter2 = 0
setInterval(() => {
    emitter.emit("stream2", counter2)
    counter2++
}, 250)


emitter.on("test-result", (v) => console.log(v))