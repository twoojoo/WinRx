import { tumblingWindow } from "../src"
import { interval, tap } from "rxjs"

let countBefore = 0
let countAfter = 0

interval(1).pipe(
    tap(_ => countBefore++),
    tumblingWindow({ size: 5000 }),
    tap((v: number[]) => console.log("window closed -", v.length, "items")),
    tap(v => countAfter += v.length)
).subscribe(() => { 
    console.log("count:", countAfter, "/", countBefore)
    if (countAfter != countBefore) throw Error("count mismatch!")
});

