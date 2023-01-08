import { stream } from "../src/sources";
import { EventEmitter } from "events"

const emitter = new EventEmitter()

stream()
    .fromEvent<{i: number}>(emitter, "test-event")
    .map(e => e.value.toString())
    .forEach(e => console.log(e))


let counter = 0
setInterval(() => {
    emitter.emit("test-event", `{"i": ${counter}}`)
    counter++
}, 500)


emitter.on("test-result", (v) => console.log(v))
emitter.on("test-result-1", (v) => console.log(v))