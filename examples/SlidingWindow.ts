import { EventEmitter } from "events"
import { slidingWindow } from "../src"
import { Observable, tap } from "rxjs"
import delay from "delay"

const emitter = new EventEmitter()

let countBefore = 0
let countAfter = 0

new Observable<number>(subscriber => {
    emitter.on("next", (value) => subscriber.next(value))
    emitter.on("complete", () => subscriber.complete())
}).pipe(
    tap(_ => countBefore++),
    slidingWindow({
        size: [10, "s"], 
        watermark: [500, "ms"],
        condition: (events => events.length >= 3)
    }),
    tap((v: number[]) => console.log("window closed -", v.length, "items")),
    tap(v => countAfter += v.length)
).subscribe((e) => {
    console.log(e.join(", "))
    // if (countAfter != countBefore) throw Error("count mismatch!")
});

(async function () {
    for (let i = 0; i < 20000; i++) {
        // if (i == 5500) await delay(3000)
        // else 
        await delay(3333)
        emitter.emit("next", i)
    }
    // emitter.emit("complete")
})()
