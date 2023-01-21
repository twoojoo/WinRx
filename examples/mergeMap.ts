import { Stream } from "../src";
import { EventEmitter } from "events"

const emitter = new EventEmitter()

const S1 = "stream1"
const S2 = "stream2"

const stream2 = Stream(S2)
    .fromEvent<string>(emitter)
    .map(e => e.value)

const stream1 = Stream(S1)
    .fromEvent<number>(emitter)
    .map(e => e.value)
    .mergeMapSame(
        stream2,
        e1 => e1 * 10,
        e2 => parseInt(e2)
    )

stream1.toEvent(emitter, "test-result")

let counter1 = 0
setInterval(() => {
    emitter.emit(S1, counter1)
    counter1 += 2
}, 500)

let counter2 = ""
setInterval(() => {
    emitter.emit(S2, counter2)
    counter2 += "1"
}, 250)


// emitter.on("test-result", (v) => console.log(v))