import { tumblingWindow } from "../src"
import { interval, tap } from "rxjs"

interval(10).pipe(
    tumblingWindow({size: 5000}),   
    tap((v: number[]) => console.log("window closed -", v.length, "items"))
).subscribe(() => {});

