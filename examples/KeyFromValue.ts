import { EventEmitter } from "events"
import { sessionWindow } from "../src"
import { Observable, tap } from "rxjs"
import delay from "delay"

const emitter = new EventEmitter()

new Observable<any>(subscriber => {
    emitter.on("next", (value) => subscriber.next(value))
    emitter.on("complete", () => subscriber.complete())
}).pipe(
    sessionWindow({maxDuration: 5000, timeoutSize: 2000, keyFrom: v => v.key}),
    tap((v: any[]) => console.log("window closed -", v.length, "items"))
).subscribe((v) => console.log(v));

(async function () {
    for (let i = 0; i < 3000; i++) {
        if (i == 500) await delay(3000)
        else await delay(10)
        emitter.emit("next", {
            key: randomIntFromInterval(1, 3),
            value: i
        })
    }
    emitter.emit("complete")
})()

function randomIntFromInterval(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}