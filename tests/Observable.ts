import { WindowedObservable, Storage,  TumblingWindow } from "../src";
import { Observable, Observer } from "rxjs";
import { EventEmitter } from "events"
import delay from "delay"


const emitter = new EventEmitter()

// const emitter = new EventEmitter()

const observable = new Observable<number>(subscriber => {
    emitter.on("test", (value) => {
        subscriber.next(value)
    })
})

const results: number[][] = []

const windowedObservable = (new WindowedObservable<number>({
    window: new TumblingWindow(new Storage.Memory(), 5000)
})).from(observable);


const observer: Observer<number[]> = {
    next: (v: number[]) => {console.log("next:", v); results.push(v)},
    error: (v: number[]) => console.log("error:", v),
    complete: () => console.log("complete")
};

windowedObservable.subscribe(observer);

(async function () {
    for (let i = 0; i < 10000; i++) {
        await delay(10)
        emitter.emit("test", i)
    }

    console.log(results.length)
})()

