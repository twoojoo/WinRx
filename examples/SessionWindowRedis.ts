import { EventEmitter } from "events"
import { sessionWindow, redis } from "../src"
import { Observable, tap, map } from "rxjs"
import delay from "delay"
import Redis from "ioredis"

const emitter = new EventEmitter()

let windowCount = 0
let receivedKeys = [false, false, false]
let countBefore = [0, 0, 0]
let countAfter = [0, 0, 0]
let total = 0

type Event = {
    key: number,
    timestamp: number,
    value: any
}

const client = new Redis("redis://localhost:6379")

new Observable<Event>(subscriber => {
    emitter.on("next", (value) => subscriber.next(value))
    emitter.on("complete", () => subscriber.complete())
}).pipe(
    tap(e => countBefore[e.key]++),
    sessionWindow<any>({
        stateManager: redis(client),
        size: [1, "s"],
        timeout: [500, "ms"],
        watermark: [1, "s"],
        withEventKey: v => v.key,
        withEventTime: v => v.timestamp,
        logger: {toConsole: true}
    }),
    tap(e => {
        const key = e[0].key
        countAfter[key] += e.length
        receivedKeys[key] = true
    })
).subscribe(i => {});

(async function () {
    for (let i = 0; i < 100000; i++) {
        if (i == 5200) await delay(3000)
        else await delay(1)
        emitter.emit("next", {
            key: randomIntFromInterval(0, 2),
            timestamp: Date.now(),
            value: i
        })
    }

    setTimeout(() => {
        const final = countAfter.reduce((a, b) => a + b, 0)
        const total = countBefore.reduce((a, b) => a + b, 0)
        let mark = "="
        if (final > total) mark = ">"
        else if (final < total) mark = "<"
        console.log("total :", final, total, mark)
    }, 20000)
})()

function randomIntFromInterval(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}