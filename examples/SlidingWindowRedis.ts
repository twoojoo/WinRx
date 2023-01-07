import { redis, slidingWindow } from "../src"
import { Subject, tap } from "rxjs"
import delay from "delay"
import Redis from "ioredis"

const client = new Redis("redis://localhost:6379")

const subj = new Subject()
subj.pipe(
    slidingWindow<any>({
        size: [2, "s"], 
        watermark: [1000, "ms"],
        logger: {toConsole: true},
        withEventTime: e => e.ts,
        stateManager: redis(client)
    })
).subscribe((e) => {
    // console.log(e.map(e => e["i"]).join(", "))
});

(async function () {
    for (let i = 0; i < 20000; i++) {
        await delay(200)
        subj.next({
            i,
            ts: Date.now()
        })
    }
})()

