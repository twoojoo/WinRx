import { EventEmitter } from "events"
import { sessionWindow } from "../src"
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
    value: any
}

const client = new Redis("redis://localhost:6379")

new Observable<Event>(subscriber => {
    emitter.on("next", (value) => subscriber.next(value))
    emitter.on("complete", () => subscriber.complete())
}).pipe(
    tap(e => countBefore[e.key]++),
    sessionWindow({
        maxDuration: 5000,
        timeoutSize: 2000,
        keyFrom: v => v.key
    }),
    tap(e => {
        const key = e[0].key
        countAfter[key] += e.length
        total += e.length
        receivedKeys[key] = true
    })
).subscribe(i => {
    if (!receivedKeys.includes(false)) {
        receivedKeys = [false, false, false]
        windowCount++
        countBefore.forEach((_, i) => {
            const before = countBefore[i]
            const after = countAfter[i]
            let mark = "="
            if (after > before) mark = ">"
            else if (after < before) mark = "<"
            console.log("win", windowCount, "| key", i, ":", after, "/", before, "|", mark)
        })
    }
});

(async function () {
    for (let i = 0; i < 10000; i++) {
        if (i == 5200) await delay(3000)
        else await delay(1)
        emitter.emit("next", {
            key: randomIntFromInterval(0, 2),
            value: i
        })
    }

    setTimeout(() => {
        const final = countAfter.reduce((a, b) => a + b, 0)
        let mark = "="
        if (final > total) mark = ">"
        else if (final < total) mark = "<"
        console.log("total :", final, total, mark)
    }, 5100)
})()

function randomIntFromInterval(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}