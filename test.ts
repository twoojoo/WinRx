import { from, interval, tap } from "rxjs"
import { countingWindow } from "./src"

const events = [{
    key: 1,
    value: "ciao"
},{
    key: 1,
    value: ""
},{
    key: 2,
    value: ""
},{
    key: 1,
    value: ""
},{
    key: 2,
    value: ""
}];

interval(10).pipe(
    countingWindow({
        size: 2, 
        keyFrom: (e: any) => e.key
    })
).subscribe((e: any) => console.log(e))
