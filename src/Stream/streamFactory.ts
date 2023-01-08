import { Consumer, ConsumerConfig } from "kafkajs";
import { EventEmitter } from "events"
import { Subject } from "rxjs";
import { streamFromSubject } from "./streamFromSubject";
import { Stream } from "../Types/Stream";

export type StreamFactory<T> = {
    fromKafka: <T>(consumer: Consumer, topics: string[], config?: ConsumerConfig) => Stream<{ key: string, value: T }>
    fromEvent: <T>(emitter: EventEmitter, name: string) => Stream<{ name: string, value: T }>
}

export function stream<T>(name?: string): StreamFactory<T> {
    const rxSubj = new Subject<any>();

    return {
        fromKafka: <T>(consumer: Consumer, topics: string[], config?: ConsumerConfig) => {
            consumer.run({
                ...config,
                eachMessage: async ({ message, topic }) => {
                    if (!topics.includes(topic)) return

                    const key = message.key.toString("utf-8")
                    const valueStr = message.value.toString("utf-8")

                    rxSubj.next({ 
                        key, 
                        value: attemptJsonParsing(valueStr) 
                    })
                }
            })

            return streamFromSubject<{ key: string, value: T }>(rxSubj)
        },

        fromEvent: <T>(emitter: EventEmitter, name: string) => {
            emitter.on(name, (value) => {
                rxSubj.next({
                    name,
                    value: attemptJsonParsing(value)
                })
            })

            return  streamFromSubject<{ name: string, value: T }>(rxSubj)
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