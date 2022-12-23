
import { EventEmitter } from "events"
import { WindowedObserver, Storage, TumblingWindow } from "../src"
import { Observable } from "rxjs"
import delay from "delay"

const emitter = new EventEmitter()

const observable = new Observable(subscriber => {
    emitter.on("test", (value) => {
        subscriber.next(value)
    })
})

const results: number[][] = []

const windowedSubject = (new WindowedObserver({window: new TumblingWindow(new Storage.Memory(), 5000)})).from({
    next: (x) => {console.log("next", x); results.push(x as number[])},
    error: (x) => console.log("error", x),
    complete: () => console.log("complete"),
})

observable.subscribe(windowedSubject);

(async function () {
    for (let i = 0; i < 10000; i++) {
        await delay(10)
        emitter.emit("test", i)
    }

    console.log(results.length)
})()

