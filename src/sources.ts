import { Consumer, ConsumerConfig } from "kafkajs";
import { EventEmitter } from "events"
import { Subject } from "rxjs";
import { streamFromSubject } from "./Utils/parseStream";
import { Stream } from "./Types/Stream";
import { StateMananger } from "./Models/StateManager";
import { Memory } from "./QueueManager";
import { Queue } from "./queue";
import { QueueManager } from "./Models/QueueManager";

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

export function stream(name: string, queueManager: QueueManager<any> = new Memory<any>()): Sources {
    
    queueManager.setStreamName(name)
    const queue = new Queue(queueManager)
    
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
                    
                    await queue.enqueue(event)
                    await queue.dequeueLoop((event) => sub.next(event))
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

                await queue.enqueue(event)
                await queue.dequeueLoop((event) => sub.next(event))
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