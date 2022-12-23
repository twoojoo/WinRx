# WinRx - A Windowing System for RXJS

**WinRx** allows you to extend RXJS' *Observables*, *Observers* and *Subjects* windowing capablities to make them able to process windows of data from a stream in a more customized way. Intstead of processing data from a stream one by one, you can process a window of array-collected data extracted from a stream according to the window type, while persisting data in a custom storage.
### Supported Window Types
- [Tumbling Window](#tumbling-window)
- [Counting Window](#counting-window)
- [Session Window](#session-window)
- [Hopping Window](#hopping-window)
- [Snapshot Window](#snapshot-window)

### Supported Storage Types
- [Memory](#memory)

## Window Types
### Tumbling Window

### Counting Window
A very basic windowing that accumulates elements up to a fized size. When the size is reached it releases them.

### Session Window

### Hopping Window

### Snapshot Window

## Storage Types

### Memory