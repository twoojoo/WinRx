
import { EventEmitter } from "events"
import { WindowedObserver, Storage, TumblingWindow, SnapshotWindow } from "../src"
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
})

const results: number[][] = []

const windowedObserver = (new WindowedObserver(new SnapshotWindow({
    timestamp: Date.now() + 5000,
    tolerance: 22,
    closeOnComplete: true
}))).from({
    next: (x) => {console.log("next", x); results.push(x as number[])},
    error: (x) => console.log("error", x),
    complete: () => console.log("complete"),
});

observable.subscribe(windowedObserver);

(async function () {
    for (let i = 0; i < 3000; i++) {
        await delay(10)
        emitter.emit("next", i)
    }
    emitter.emit("complete")

    console.log(results.flat().length)
})()

