import { stream } from "../src/sources";
import { EventEmitter } from "events"

const emitter = new EventEmitter()

stream()
    .fromEvent<{i: number}>(emitter, "test-event")
    .map(e => JSON.stringify(e))
    .forEach(e => console.log(e))
    .tumblingWindow({size: 2000})
    .toEvent(emitter, "test-result")


let counter = 0
setInterval(() => {
    emitter.emit("test-event", `{"i": ${counter}}`)
    counter++
}, 500)


emitter.on("test-result", (v) => console.log(v))
emitter.on("test-result-1", (v) => console.log(v))