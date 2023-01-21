import { Stream } from "../src";
import { EventEmitter } from "events";
import { randomInt } from "crypto"

const emitter = new EventEmitter()

const MAX_COUNT = 2000
const FREQ = 1

const counters = {
    input: 0,
    output: 0
}

type myEvent = {
    key: number,
    time: number,
    counter: number
}

Stream("stream1")
    .fromEvent<myEvent>(emitter, "stream1")
    .map(e => e.value)
    .withEventKey(e => e.key)
    .every(2000, () => console.log("LAST EVENT!!!!"))
    .tumblingWindow("tw1", { size: 3000, watermark: 500 })
    .forEach(e => {
        // counters.output += e.length
        // e.map(_ => _.counter)
        // if (e.map(_ => _.counter).includes(MAX_COUNT - 1)) {
        //     console.log(counters.output, "/", counters.input)
        //     if (counters.output == counters.input) process.exit(0)
        //     else throw Error("counters mismatch")   
        // }
    })

setInterval(() => {
    if (counters.input >= MAX_COUNT) return
    emitter.emit("stream1", {
        counter: counters.input,
        key: randomInt(2),
        time: Date.now() - 100
    })
    counters.input += 1
}, FREQ)

// emitter.on("test-result", (v) => console.log(v))