import { EventEmitter } from "events"
import { tumblingWindow, redis } from "../src"
import { Observable, Subject, tap } from "rxjs"
import delay from "delay"
import Redis from "ioredis"

const emitter = new EventEmitter()

let countBefore = 0
let countAfter = 0

const client = new Redis("redis://localhost:6379")

const subj = new Subject()
subj.pipe(
    tap(_ => countBefore++),
    tumblingWindow({
        size: [5, "s"],
        watermark: [500, "ms"],
        stateManager: redis(client),
        logger: { toConsole: true }
    }),
    tap(v => countAfter += v.length)
).subscribe(() => {
    console.log("count:", countAfter, "/", countBefore)
});

(async function () {
    for (let i = 0; i < 20000; i++) {
        await delay(1)
        subj.next(i)
    }
})()

