import { hoppingWindow } from "../src"
import { interval, tap } from "rxjs"

interval(10).pipe(
    hoppingWindow({size: 5000, hop: 2000}),
    tap((v: number[]) => console.log("window closed -", v.length, "items"))
).subscribe(() => {})


