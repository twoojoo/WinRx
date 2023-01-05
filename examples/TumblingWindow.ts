import { EventEmitter } from "events"
import { tumblingWindow } from "../src"
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
    tumblingWindow({
        size: [5, "s"], 
        watermark: [500, "ms"]
    }),
    tap((v: number[]) => console.log("window closed -", v.length, "items")),
    tap(v => countAfter += v.length)
).subscribe(() => {
    console.log("count:", countAfter, "/", countBefore)
    // if (countAfter != countBefore) throw Error("count mismatch!")
});

(async function () {
    for (let i = 0; i < 20000; i++) {
        await delay(1)
        emitter.emit("next", i)
    }
})()

