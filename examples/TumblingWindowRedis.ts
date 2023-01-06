import { tumblingWindow, redis } from "../src"
import { Subject, tap } from "rxjs"
import delay from "delay"
import Redis from "ioredis"

let countBefore = 0
let countAfter = 0

const client = new Redis("redis://localhost:6379")

const subj = new Subject<any>()
subj.pipe(
    tap(_ => countBefore++),
    tumblingWindow<any>({
        size: [5, "s"],
        watermark: [2000, "ms"],
        stateManager: redis(client),
        logger: { toConsole: true },
        withEventTime: e => e.ts,
    }),
    tap(v => countAfter += v.length)
).subscribe(() => {
    console.log("count:", countAfter, "/", countBefore)
});

(async function () {
    for (let i = 0; i < 20000; i++) {
        await delay(1)
        subj.next({
            ts: Date.now(),
            i
        })
    }

    //late data test
    subj.next({
        mark: "mark",
        ts: Date.now() - 7001,
    })



    // setInterval(() =>{
    //     subj.next({
    //         ts: Date.now()
    //     })
    // }, 1)
})()

