import { Stream, Pool } from "../src/stream";
import { EventEmitter } from "events"

const emitter = new EventEmitter()

Stream("stream2")
    .fromEvent<string>(emitter, "stream2")
    .map(e => e.value)

Stream("stream1")
    .fromEvent<number>(emitter, "stream1")
    .map(e => e.value)
    .merge(Pool().get("stream2"))

Pool().get("stream1").toEvent(emitter, "test-result")

let counter1 = 0
setInterval(() => {
    emitter.emit("stream1", counter1)
    counter1 += 2
}, 500)

let counter2 = ""
setInterval(() => {
    emitter.emit("stream2", counter2)
    counter2 += "a "
}, 250)


emitter.on("test-result", (v) => console.log(v))