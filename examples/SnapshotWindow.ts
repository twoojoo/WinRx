import { snapshotWindow } from "../src"
import { interval, tap } from "rxjs"

interval(10).pipe(
    snapshotWindow({offset: 5000, tolerance: 30}),
    tap((v: number[]) => console.log("window closed -", v.length, "items"))
).subscribe(() => {})