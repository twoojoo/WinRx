export type EventKey = string | number

export type Event<T> = {
    value: T,
    eventKey: EventKey,
    eventTime: number,
    processingTime: number,
    windowId?: string
}

// export class Event<T> {
//     readonly value: T
//     readonly eventKey: EventKey
//     readonly eventTime: number
//     readonly processingTime: number
    
//     windowId: string

//     constructor(params: EventParams<T>) {
//         this.eventTime = params.eventTime
//         this.eventKey = params.eventKey
//         this.processingTime = params.processingTime
//         this.value = params.value
//         this.windowId = params.windowId
//     }

    // value() { return this._value }
    // eventKey() { return this._eventKey }
    // eventTime() { return this._eventTime }
    // processingTime() { return this._processingTime }
    // windowId() { return this._windowId }
    // isAssigned() { return !!this._windowId }

    // assign(windowId: string) {
    //     if (this._windowId) throw Error("event already assigned to a window")
    //     this._windowId = windowId
    // }
// }