import { Consumer, ConsumerConfig } from "kafkajs";
import { EventEmitter } from "events"
import { Stream, StreamContext, streamFromSubject } from "../stream";
import { makeMetaEvent, MetaEvent } from "../event";
import { Subject } from "rxjs";
import { Logger } from "../logger";

type KafkaEvent<E> = {
    key: string,
    value: E
}

type NativeEvent<E> = {
    name: string,
    value: E
}

export type Sources = {   
    /**Create a stream of kafka messages consumed from a topic or more (uses stream name as topic name if topics array is not provided)*/
    fromKafka: <E>(consumer: Consumer, topics?: string[], config?: ConsumerConfig) => Stream<KafkaEvent<E>>
    /**Create a stream from a named event (uses stream name as event name if not provided)*/
    fromEvent: <E>(emitter: EventEmitter, name?: string) => Stream<NativeEvent<E>>
}

export function sourcesFactory(ctx: StreamContext): Sources {
    return {
        fromKafka<E>(consumer: Consumer, topics?: string[], config?: ConsumerConfig): Stream<KafkaEvent<E>> {
            if (!topics || topics.length == 0) topics = [ctx.name] //use stream name as topic if topics not provided

            const sub = new Subject<MetaEvent<KafkaEvent<E>>>();
            consumer.run({
                ...config,
                eachMessage: async ({ message, topic }) => {
                    if (!topics.includes(topic)) return

                    const event = {
                        key: message.key.toString("utf-8"),
                        value: attemptJsonParsing(message.value.toString("utf-8"))
                    }

                    Logger(ctx).info(`ingested Kafka event - topic: ${topic} - key: ${event.key}`)

                    await ctx.stateManager.enqueueEvent(makeMetaEvent(event))
                    ctx.stateManager.dequeueLoop(sub)
                }
            })

            return streamFromSubject(ctx, sub)
        },

        fromEvent<E>(emitter: EventEmitter, name?: string): Stream<NativeEvent<E>> {
            if (!name) name = ctx.name //use stream name as event name if event name is not provided

            const sub = new Subject<MetaEvent<NativeEvent<E>>>();
            emitter.on(name, async (value) => {
                const event = {
                    name,
                    value: attemptJsonParsing(value)
                }

                Logger(ctx).info("ingested native event - name: " + event.name)

                await ctx.stateManager.enqueueEvent(makeMetaEvent(event))
                ctx.stateManager.dequeueLoop(sub)
            })

            return streamFromSubject(ctx, sub)
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