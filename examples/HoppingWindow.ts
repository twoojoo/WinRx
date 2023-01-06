import { EventEmitter } from "events"
import { hoppingWindow } from "../src"
import { Observable, Subject, tap } from "rxjs"
import delay from "delay"

const emitter = new EventEmitter()

let windowCount = 0
let receivedKeys = [false, false, false]
let countBefore = [0, 0, 0]
let countAfter = [0, 0, 0]
let total = 0

const subj = new Subject<any>()
subj.pipe(
    tap(e => countBefore[e.key]++),
    hoppingWindow({
        size: 5000, 
        hop: 2500,
        watermark: 200,
        // withEventKey: (e) => e.key,
        logger: {toConsole: true}
    }),
    tap(e => {
        const key = e[0].key
        countAfter[key] += e.length
        receivedKeys[key] = true
    })
).subscribe(() => {});

(async function () {
    for (let i = 0; i < 20000; i++) {

        await delay(1)
        subj.next({
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
