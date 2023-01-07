import { slidingWindow } from "../src"
import { Subject, tap } from "rxjs"
import delay from "delay"

let countBefore = 0
let countAfter = 0

const subj = new Subject()
subj.pipe(
    tap(_ => countBefore++),
    slidingWindow<any>({
        size: [10, "s"], 
        watermark: [500, "ms"],
        // condition: (events => events.length >= 4),
        logger: {toConsole: true}
    }),
    tap((v: number[]) => console.log("window closed -", v.length, "items")),
    tap(v => countAfter += v.length)
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

