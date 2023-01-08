import { EventEmitter } from "events"
import { hoppingWindow } from "../src"
import { Observable, Subject, tap } from "rxjs"
import delay from "delay"

const emitter = new EventEmitter()

let countBefore = 0
let countAfter = 0

const subj = new Subject<{timestamp: number, value: number}>()
subj.pipe(
    tap(e => countBefore++),
    hoppingWindow({
        size: 5000, 
        hop: 2500,
        watermark: 200,
        logger: {toConsole: true}
    }),
    tap(e => {
        // const key = e[0].key
        countAfter += e.length
        // receivedKeys[key] = true
    })
).subscribe(() => {});

(async function () {
    for (let i = 0; i < 20000; i++) {
        await delay(1)
        subj.next({
            timestamp: Date.now(),
            value: i
        })
    }

    setTimeout(() => {
        console.log(countAfter, "/", countBefore)
    }, 20000)
})()