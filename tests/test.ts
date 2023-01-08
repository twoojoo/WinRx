import { stream } from "../src/Stream/streamFactory";
import { EventEmitter } from "events"
import { forEach, map, tumblingWindow } from "../src";

const emitter = new EventEmitter()

stream().fromEvent(emitter, "test-event").flow(
    map(event => event["value"]["i"] + 2),
    forEach(event => console.log("hey")),
    tumblingWindow({ size: [2, "s"] })
).toEvent(emitter, "test-result").flow(
    tumblingWindow({ size: [4, "s"] })
).toEvent(emitter, "test-result-1")

let counter = 0
setInterval(() => {
    emitter.emit("test-event", `{"i": ${counter}}`)
    counter++
}, 500)


emitter.on("test-result", (v) => console.log(v))
emitter.on("test-result-1", (v) => console.log(v))