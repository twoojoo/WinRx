import { EventEmitter } from "events"
import { sessionWindow } from "../src"
import { Observable, tap } from "rxjs"
import delay from "delay"

const emitter = new EventEmitter()

new Observable<number>(subscriber => {
    emitter.on("next", (value) => subscriber.next(value))
    emitter.on("complete", () => subscriber.complete())
}).pipe(
    sessionWindow({maxDuration: 5000, timeoutSize: 2000}),
    tap((v: number[]) => console.log("window closed -", v.length, "items"))
).subscribe(() => {});

(async function () {
    for (let i = 0; i < 3000; i++) {
        if (i == 500) await delay(3000)
        else await delay(10)
        emitter.emit("next", i)
    }
    emitter.emit("complete")
})()

