import { Stream } from "../src/stream";
import { EventEmitter } from "events"

const emitter = new EventEmitter()

const stream1 = Stream("stream1")
    .fromEvent<number>(emitter, "stream1")
    .tumblingWindow("tw1", {size: 3000, watermark: 500})

stream1.toEvent(emitter, "test-result")

let counter1 = 0
setInterval(() => {
    emitter.emit("stream1", counter1)
    counter1 += 2
}, 500)

emitter.on("test-result", (v) => console.log(v))