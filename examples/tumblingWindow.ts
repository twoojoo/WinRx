import { Stream } from "../src";
import { EventEmitter } from "events";
import { randomInt } from "crypto"

const emitter = new EventEmitter()

const MAX_COUNT = 20000
const DELAY = 100
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

Stream("input", undefined, false)
    .fromEvent<myEvent>(emitter)
    .map(e => e.value)
    .withEventKey(e => e.key)
    .withEventTime(e => e.time)
    .every(MAX_COUNT, () => console.log(`EVENT #`, MAX_COUNT))
    .tumblingWindow("tw1", { size: 3000, watermark: 500 })
    .toEvent(emitter, "output")
    
setTimeout(() => {
    setInterval(() => {
        if (counters.input >= MAX_COUNT) return
        emitter.emit("input", {
            counter: counters.input,
            key: randomInt(2),
            time: Date.now() - DELAY
        })
        counters.input += 1
    }, FREQ)
}, DELAY)

emitter.on("output", (e: myEvent[]) => {
    counters.output += e.length
    console.log(e.length, "=> [", counters.output, "/", MAX_COUNT, "]")
    if (counters.output == MAX_COUNT) setTimeout(() => process.exit(0), 500)
})