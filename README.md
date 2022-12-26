# WinRx - A Windowing System for RXJS

By introducing new operators, **WinRx** allows you to extend RXJS' windowing capablities to make it able to process windows of data from a stream in a more customized way. Intstead of processing data from a stream one by one, you can process a window of array-collected data extracted from a stream according to the window type, while persisting data in a custom storage.
### Supported Window Types
- [Tumbling Window](#tumbling-window)
- [Counting Window](#counting-window)
- [Session Window](#session-window)
- [Hopping Window](#hopping-window)
- [Snapshot Window](#snapshot-window)

### Supported Storage Types
- [Memory](#memory)
- [Redis](#redis)

## General behaviour
Every window operator receives single **T** value and outputs a **T[]** value each time a window is closed. Whenever an *error* or *complete* event is triggered, active windows gets forcibly closed, unless the **closeOnError** and **closeOnComplete** options are set to false (true if omitted).

## Window Types
### Tumbling Window

### Counting Window

### Session Window

### Hopping Window

### Snapshot Window

## Storage Types

### Memory

### Redis