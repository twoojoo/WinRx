import { snapshotWindow } from "../src"
import { interval, tap } from "rxjs"

interval(1).pipe(
    snapshotWindow({offset: 5000, tolerance: 1}),
    tap((v: number[]) => console.log("window closed -", v.length, "items"))
).subscribe((v) => {
    if (v.length != 1) throw Error(`expected 1 item, received ${v.length} items`)
})