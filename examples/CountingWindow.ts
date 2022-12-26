import { countingWindow } from "../src"
import { interval, tap } from "rxjs"

interval(10).pipe(
    countingWindow({ size: 100 }),
    tap((v: number[]) => console.log("window closed -", v.length, "items"))
).subscribe(() => { })


