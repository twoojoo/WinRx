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
Data windowing based on fixed-sized, contiguous and non-overlapping windows.

### Counting Window
A very basic windowing system that accumulates elements up to a fized size. When the size is reached all stored elements are released and the storage gets cleaned. Specific paramether is the *size* of the window, namely the number of events. Uses the same counter for both errors and next events, but releases them in separated chunks, thus the output, whether it is an error or next output, can contain less events thant the window size, but never more.

### Session Window

### Hopping Window

### Snapshot Window

## Storage Types

### Memory