import { EventEmitter } from "events"
import { snapshotWindow } from "../src"
import { Observable } from "rxjs"
import delay from "delay"

const emitter = new EventEmitter()

const observable = new Observable<number>(subscriber => {
    emitter.on("next", (value) => {
        subscriber.next(value)
    })

    emitter.on("complete", (value) => {
        subscriber.complete()
    })
}).pipe(snapshotWindow({offset: 5000, tolerance: 30}))

const results: number[][] = []

const observer = {
    next: (x: any) => { console.log("next", x); results.push(x as number[]) },
    error: (x: any) => console.log("error", x),
    complete: () => console.log("complete"),
};

observable.subscribe(observer);

(async function () {
    for (let i = 0; i < 3000; i++) {
        if (i == 500) await delay(3000)
        else await delay(10)
        emitter.emit("next", i)
    }
    emitter.emit("complete")

    console.log(results.flat().length)
})()

