# WinRx - A Windowing System for RXJS

By introducing new operators, **WinRx** allows you to extend RXJS' windowing capablities to make it able to process windows of data from a stream in a more customized way. Intstead of processing data from a stream one by one, you can process a window of array-collected data extracted from a stream according to the window type, while persisting data in a custom storage.
### Supported Window Types
- [Tumbling Window](#tumbling-window)
- [Session Window](#session-window)
- [Hopping Window](#hopping-window)
- [Snapshot Window](#snapshot-window)

### Supported Storage Types
- [Memory](#memory)
- [Redis](#redis)

## General behaviour
- Every window operator receives single **T** value and outputs a **T[]** value each time a window is closed. 
- Whenever an *error* or *complete* event is triggered, active windows gets forcibly closed, unless the **closeOnError** and **closeOnComplete** options are set to false (true if omitted). If these options are set to false, all values that are not included in an already closed window will be lost.
- In case of an **error** event, the value is still passed as an array of length 1 to maintain consistency with next events.

## Features
### Custom Event Key and Timestamp
Events streamed throught the same observable can be split in multiple separated windowing pipelines by providing a function to extract a key from the event itself (otherwise all events come with the "default" key). In this way, events with different keys will be treated as separated streams flowing through the same pipeline.

```typescript
const events = [{
    key: 1
    value: 
}]

of(events).pipe(countingWindow({size: 2}))
```
## Window Types
### Tumbling Window

### Session Window

### Hopping Window

### Snapshot Window

## Storage Types

### Memory

### Redis