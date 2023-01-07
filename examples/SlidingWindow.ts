import { redis, slidingWindow } from "../src"
import { Subject, tap } from "rxjs"
import delay from "delay"

const subj = new Subject()
subj.pipe(
    slidingWindow<any>({
        size: [2, "s"], 
        watermark: [10, "ms"],
        logger: {toConsole: true},
        withEventTime: e => e.ts
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

