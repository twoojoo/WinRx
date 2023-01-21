import { Stream, Pool } from "../src";
import { EventEmitter } from "events"

const emitter = new EventEmitter()

Stream("stream2")
    .fromEvent<string>(emitter, "stream2")
    .map(e => e.value)

Stream("stream1")
    .fromEvent<number>(emitter, "stream1")
    .withEventKey(_ => "default")
    .map(e => e.value)
    .mergeMap(
        Pool().getStream<string>("stream2"),
        e1 => e1,
        e2 => parseInt(e2)
    )

Pool().getStream<number>("stream1").toEvent(emitter, "test-result")
console.log(Pool().list())

let counter1 = 0
setInterval(() => {
    emitter.emit("stream1", counter1)
    counter1 += 2
}, 500)

let counter2 = "1"
setInterval(() => {
    emitter.emit("stream2", counter2)
    counter2 += "1"
}, 250)


emitter.on("test-result", (v) => console.log(v))