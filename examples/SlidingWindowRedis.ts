import { redis, slidingWindow } from "../src"
import { Subject, tap } from "rxjs"
import delay from "delay"
import Redis from "ioredis"

const client = new Redis("redis://localhost:6379")

const subj = new Subject()
subj.pipe(
    slidingWindow<any>({
        size: [10, "s"], 
        watermark: [500, "ms"],
        logger: {toConsole: true},
        stateManager: redis(client)
    })
).subscribe((e) => {
    console.log(e.map(e => e["i"]).join(", "))
});

(async function () {
    for (let i = 0; i < 20000; i++) {
        await delay(3400)
        subj.next({
            i,
            ts: Date.now()
        })
    }
})()

