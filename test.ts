import { from, tap } from "rxjs"
import { countingWindow, sessionWindow } from "./src"

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

from(events).pipe(
    tap(v => console.log(v)),
    countingWindow({
        size: 2, 
        // keyFrom: (e: any) => e.key
    }),
    tap(v => console.log(v))
).subscribe((e: any) => {})


setInterval(function() {}, 60000);