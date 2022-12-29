import { EventEmitter } from "events"
import { sessionWindow } from "../src"
import { Observable, tap, map } from "rxjs"
import delay from "delay"

const emitter = new EventEmitter()

let countBefore = 0
let countAfter = 0

let receivedKeys = [false, false, false]

type Event = {
    key: number,
    value: any
}

new Observable<any>(subscriber => {
    emitter.on("next", (value) => subscriber.next(value))
    emitter.on("complete", () => subscriber.complete())
}).pipe(
    tap(_ => countBefore++),
    sessionWindow({ 
        maxDuration: 5000, 
        timeoutSize: 2000, 
        keyFrom: v => v.key 
    }),
    map((v: Event[]) => ({
        countBefore: countBefore,
        countAfter: countAfter += v.length, 
        event: v})),
    tap(i =>{ 
        const key = i.event[0].key
        receivedKeys[key - 1] = true
    })
).subscribe(i => {
    if (!receivedKeys.includes(false)) {
        receivedKeys = [false, false, false]
        console.log("count:", i.countAfter, "/", i.countBefore)
        if (i.countAfter != i.countBefore) throw Error("count mismatch!")
    }
});

(async function () {
    for (let i = 0; i < 30000; i++) {
        // if (i == 500) await delay(3000)
        await delay(1)
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