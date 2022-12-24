
import { EventEmitter } from "events"
import { WindowedObserver, Storage, TumblingWindow, SnapshotWindow } from "../src"
import { Observable } from "rxjs"
import delay from "delay"
import { default as RedisClient } from "ioredis"

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
const client = new RedisClient("redis://localhost:6379")
client.on("connect", () => console.log("connected to redis"))

const windowedObserver = (new WindowedObserver(new SnapshotWindow({
    storage: new Storage.Redis(client),
    offset: 5000,
    tolerance: 15,
    closeOnComplete: true
}))).from({
    next: (x) => { console.log("next", x); results.push(x as number[]) },
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

