# WinRx - A Windowing System for RXJS

> **Note**: this project is for learning purpose only

By introducing new operators, **WinRx** allows you to extend RXJS' windowing
capablities to make it able to process windows of data from a stream in a more
customized way.

## Summary

- [Basic Architecture](#basic-architecture)
- [Features](#features)
  - [Event Time vs. Processing Time](#event-time-vs-processing-time)
  - [Events Keys](#events-keys)
- [Windowing Systems](#windowing-systems)
  - [Session Window](#session-window)
  - [Sliding Window](#sliding-window)
  - [Tumbling Window](#tumbling-window)
  - [Hopping Window](#hopping-window)
  - [Counting Window](#counting-window)
- [Sate Managers](#state-managers)
  - [Memory](#memory)
  - [Redis](#redis)

## Basic Architecture

In order to avoid back pressure, all events are stored into a **queue** as soon
as they are ingested. A **loop** keeps dequeueing them so that they can be
actually processed one by one by the **windowing system**. The windowing systems
handles the assignment of each event to a specific **bucket**, basing on event
timestamp (event time or processing time) and key. It also decides when to open
a new bucket, or close an existing one to release a **window of events**.

<br>

![schema](./winrx.png)

<br>

## Features

### Event Time vs. Processing Time

### Events Keys

## Windowing Systems

### Tumbling Window

### Session Window

### Hopping Window

### Sliding Window

> **Note**: when using siliding windows along with an external storage such as
> Redis, if the dequeue loop frequency is lower than the incoming events average
> rate, a data loss can periodically occurr because some events are dequeued
> after their window's watermark is expired. Dequeuing is slower with sliding
> windows because they involves many more timeouts than the other windowing
> systems, ending up stressing Nodejs. For this reason it is not advisable to
> use sliding windows when dealing with high-frequency events, unless it is
> acceptable to lose some data every now and then.

### Counting Window

## State Managers

### Memory

### Redis
