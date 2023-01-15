import { Consumer, ConsumerConfig } from "kafkajs";
import { EventEmitter } from "events"
import { randomUUID } from "crypto";
import { Subject } from "rxjs";
import { Join, joinFactory } from "./operators/join"
import { Merge, mergeFactory } from "./operators/merge"
import { Operators, operatorsFactory } from "./operators/operators"
import { Sinks, sinksFactory } from "./operators/sinks"
import { Windows, windowsFactory } from "./operators/windows"
import { streamPool } from "./pool";

export type Stream<T> =
    Operators<T> &
    Windows<T> &
    Join<T> &
    Merge<T> &
    Sinks<T> &
    { name: () => string }

type KafkaEvent<T> = {
    key: string,
    value: T
}

type EmitterEvent<T> = {
    name: string,
    value: T
}

export type Sources = {
    fromKafka: <T>(consumer: Consumer, topics: string[], config?: ConsumerConfig) => Stream<{ key: string, value: T }>
    fromEvent: <T>(emitter: EventEmitter, name: string) => Stream<{ name: string, value: T }>
}

// Stream functions is a sourceFactory
export function Stream(name: string = randomUUID()): Sources {
    return {
        fromKafka<T>(consumer: Consumer, topics: string[], config?: ConsumerConfig): Stream<KafkaEvent<T>> {
            const sub = new Subject<KafkaEvent<T>>();
            consumer.run({
                ...config,
                eachMessage: async ({ message, topic }) => {
                    if (!topics.includes(topic)) return

                    const event = {
                        key: message.key.toString("utf-8"),
                        value: attemptJsonParsing(message.value.toString("utf-8"))
                    }

                    sub.next(event)
                }
            })

            return streamFromSubject(name, sub)
        },

        fromEvent<T>(emitter: EventEmitter, name: string): Stream<EmitterEvent<T>> {
            const sub = new Subject<EmitterEvent<T>>();
            emitter.on(name, async (value) => {
                const event = {
                    name,
                    value: attemptJsonParsing(value)
                }

                sub.next(event)
            })

            return streamFromSubject(name, sub)
        }
    }
}

function attemptJsonParsing(value: string): any {
    try {
        return JSON.parse(value)
    } catch (err) {
        return value
    }
}

/** Converts an RXJS Subject into a Stream object */
export function streamFromSubject<T>(name: string, subj: Subject<T>): Stream<T> {
    const stream = subj as any

    Object.assign(
        stream,
        sinksFactory<T>(stream),
        windowsFactory<T>(stream),
        joinFactory<T>(stream),
        mergeFactory<T>(stream),
        operatorsFactory<T>(stream),
        { name: () => name }
    )

    streamPool[name] = stream as Stream<T>
    return stream as Stream<T>
}

/** Just Typescript sintactic sugar to parse a Stream into a RxJs Subject */
export function subjectFromStream<T>(stream: Stream<T>) {
    return (stream as unknown) as Subject<T>
}