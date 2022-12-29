import { countingWindow } from "../src"
import { interval, map, tap } from "rxjs"

const size = 100

let counterBefore = [0, 0, 0]
let counterAfter = [0, 0, 0]

interval(1).pipe(
    map(value => ({ value, key: randomIntFromInterval(0, 2) })),
    tap(v => counterBefore[v.key]++),
    countingWindow({ size, keyFrom: (v) => v.key }),
    map(v => {
        const after = counterAfter[v[0].key] += v.length

        return {
            counterBefore: counterBefore[v[0].key],
            counterAfter: after,
            value: v
        }
    }),
).subscribe((v) => {
    if (v.value.length != size) throw Error("wrong window size!")
    console.log("count", v.counterAfter, v.counterBefore)
    if (v.counterAfter != v.counterBefore) throw Error("count mismatch!")
})

function randomIntFromInterval(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}