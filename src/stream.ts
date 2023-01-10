import { streamFromSubject } from "./utils/parseStream";
import { Consumer, ConsumerConfig } from "kafkajs";
import { EventEmitter } from "events"
import { randomUUID } from "crypto";
import { Subject } from "rxjs";
import { Join } from "./operators/join"
import { Merge } from "./operators/merge"
import { Operators } from "./operators/operators"
import { Sinks } from "./operators/sinks"
import { Windows } from "./operators/windows"

type RxJsSubjectOmissions = //'pipe'
    | 'complete'
    | 'error'
    | 'asObservable'
    | 'forEach'
    | 'subscribe'
    | 'unsubscribe'
    | 'hasError'
    | 'isStopped'
    | 'lift'
    | 'operator'
    | 'source'
    | 'thrownError'
    | 'toPromise'
    | 'observers'
    | 'observed'
    | 'next'
    | 'closed'

export type Stream<T> =
    Omit<Subject<T>, RxJsSubjectOmissions> &
    Operators<T> &
    Windows<T> &
    Join<T> &
    Merge<T> &
    Sinks<T>

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

export function Stream(name: string = randomUUID()): Sources {
    return {
        fromKafka: <T>(consumer: Consumer, topics: string[], config?: ConsumerConfig): Stream<KafkaEvent<T>> => {
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

            return streamFromSubject(sub)
        },

        fromEvent: <T>(emitter: EventEmitter, name: string): Stream<EmitterEvent<T>> => {
            const sub = new Subject<EmitterEvent<T>>();
            emitter.on(name, async (value) => {
                const event = {
                    name,
                    value: attemptJsonParsing(value)
                }

                sub.next(event)
            })

            return streamFromSubject(sub)
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