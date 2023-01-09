import { streamFromSubject } from "./Utils/parseStream";
import { QueueManager } from "./Models/QueueManager";
import { Consumer, ConsumerConfig } from "kafkajs";
import { Stream } from "./Types/Stream";
import { Memory } from "./QueueManager";
import { EventEmitter } from "events"
import { randomUUID } from "crypto";
import { Queue } from "./queue";
import { Subject } from "rxjs";
import { InnerEvent, parseEvent } from "./event";

type KafkaEvent<T> = {
    key: string,
    value: T
}

type EmitterEvent<T> = {
    name: string,
    value: T
}

export type Sources = {
    fromKafka: <T>(consumer: Consumer, topics: string[], config?: ConsumerConfig) => Stream<InnerEvent<KafkaEvent<T>>>
    fromEvent: <T>(emitter: EventEmitter, name: string) => Stream<InnerEvent<EmitterEvent<T>>>
}

export function stream(streamName: string = randomUUID(), queueManager: QueueManager<any> = new Memory<any>()): Sources {
    
    queueManager.setStreamName(streamName)
    const queue = new Queue(queueManager)
    
    return {
        fromKafka: <T>(consumer: Consumer, topics: string[], config?: ConsumerConfig): Stream<InnerEvent<KafkaEvent<T>>> => {
            const sub = new Subject<InnerEvent<KafkaEvent<T>>>();
            consumer.run({
                ...config,
                eachMessage: async ({ message, topic }) => {
                    if (!topics.includes(topic)) return

                    const event = parseEvent(streamName, {
                        key: message.key.toString("utf-8"),
                        value: attemptJsonParsing(message.value.toString("utf-8"))
                    })                    

                    await queue.enqueue(event)
                    await queue.dequeueLoop((event) => sub.next(event))
                }
            })

            return streamFromSubject(sub)
        },

        fromEvent: <T>(emitter: EventEmitter, name: string): Stream<InnerEvent<EmitterEvent<T>>> => {
            const sub = new Subject<InnerEvent<EmitterEvent<T>>>();
            emitter.on(name, async (value) => {

                const event = parseEvent(streamName, {
                    name,
                    value: attemptJsonParsing(value)
                })

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
