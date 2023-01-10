import { streamFromSubject } from "./utils/parseStream";
import { Consumer, ConsumerConfig } from "kafkajs";
import { Stream } from "./windows/Types/Stream";
import { EventEmitter } from "events"
import { randomUUID } from "crypto";
import { Subject } from "rxjs";

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

export function stream(name: string = randomUUID()): Sources {
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