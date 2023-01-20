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
import { StateMananger } from "./windows/models/StateManager";
import { MetaEvent, makeMetaEvent } from "./event";

export type StreamContext = {
    name: String,
    stateManager: StateMananger<any>
}

export type Stream<E> =
    Operators<E> &
    Windows<E> &
    Join<E> &
    Merge<E> &
    Sinks<E> &
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
    /**Create a stream of kafka messages consumed from a topic or more*/
    fromKafka: <T>(consumer: Consumer, topics: string[], config?: ConsumerConfig) => Stream<KafkaEvent<T>>
    /**Create a stream from a named event*/
    fromEvent: <T>(emitter: EventEmitter, name: string) => Stream<EmitterEvent<T>>
}

// Stream functions is a sourceFactory
export function Stream(name: string = randomUUID()): Sources {
    return {
        fromKafka<T>(consumer: Consumer, topics: string[], config?: ConsumerConfig): Stream<KafkaEvent<T>> {
            const sub = new Subject<MetaEvent<KafkaEvent<T>>>();
            consumer.run({
                ...config,
                eachMessage: async ({ message, topic }) => {
                    if (!topics.includes(topic)) return

                    const event = {
                        key: message.key.toString("utf-8"),
                        value: attemptJsonParsing(message.value.toString("utf-8"))
                    }

                    sub.next(makeMetaEvent(event))
                }
            })

            return streamFromSubject(name, sub)
        },

        fromEvent<T>(emitter: EventEmitter, name: string): Stream<EmitterEvent<T>> {
            const sub = new Subject<MetaEvent<EmitterEvent<T>>>();
            emitter.on(name, async (value) => {
                const event = {
                    name,
                    value: attemptJsonParsing(value)
                }

                sub.next(makeMetaEvent(event))
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
export function streamFromSubject<E>(name: string, subj: Subject<MetaEvent<E>>): Stream<E> {
    const stream = subj as any

    Object.assign(
        stream,
        sinksFactory<E>(stream),
        windowsFactory<E>(stream),
        joinFactory<E>(stream),
        mergeFactory<E>(stream),
        operatorsFactory<E>(stream),
        { name: () => name }
    )

    streamPool[name] = stream as Stream<E>
    return stream as Stream<E>
}

/** Just Typescript sintactic sugar to parse a Stream into a RxJs Subject */
export function subjectFromStream<E>(stream: Stream<E>) {
    return (stream as unknown) as Subject<MetaEvent<E>>
}