import { Stream } from "../src/stream";
import { EventEmitter } from "events"

const emitter = new EventEmitter()

const stream2 = Stream("stream2")
    .fromEvent<string>(emitter, "stream2")
    .map(e => e.value)

const stream1 = Stream("stream1")
    .fromEvent<number>(emitter, "stream1")
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