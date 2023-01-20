import { Consumer, ConsumerConfig } from "kafkajs";
import { EventEmitter } from "events"
import { randomUUID } from "crypto";
import { Subject } from "rxjs";
// import { Join, joinFactory } from "./operators/join"
import { Merge, mergeFactory } from "./operators/merge"
import { Operators, operatorsFactory } from "./operators/operators"
import { Sinks, sinksFactory } from "./operators/sinks"
// import { Windows, windowsFactory } from "./operators/windows"
import { streamPool } from "./pool";
import { StateManager } from "./state/state-manager";
import { MetaEvent, makeMetaEvent } from "./event";
import { Init, initFactory } from "./operators/init";

export type StreamContext = {
    name: string,
    stateManager: StateManager<any>
}

export type Stream<E> =
    Init<E> &
    Operators<E> &
    // Windows<E> &
    // Join<E> &
    Merge<E> &
    Sinks<E> &
    { name: () => string } &
    { ctx: StreamContext }

type KafkaEvent<E> = {
    key: string,
    value: E
}

type EmitterEvent<E> = {
    name: string,
    value: E
}

export type Sources = {   
    /**Create a stream of kafka messages consumed from a topic or more*/
    fromKafka: <E>(consumer: Consumer, topics: string[], config?: ConsumerConfig) => Stream<KafkaEvent<E>>
    /**Create a stream from a named event*/
    fromEvent: <E>(emitter: EventEmitter, name: string) => Stream<EmitterEvent<E>>
}

// Stream functions is a sourceFactory
export function Stream(name: string = randomUUID(), stateManager: StateManager<any>): Sources {
    return {
        fromKafka<E>(consumer: Consumer, topics: string[], config?: ConsumerConfig): Stream<KafkaEvent<E>> {
            const sub = new Subject<MetaEvent<KafkaEvent<E>>>();
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

            const ctx: StreamContext = {
                name,
                stateManager
            }

            return streamFromSubject(ctx, sub)
        },

        fromEvent<E>(emitter: EventEmitter, name: string): Stream<EmitterEvent<E>> {
            const sub = new Subject<MetaEvent<EmitterEvent<E>>>();
            emitter.on(name, async (value) => {
                const event = {
                    name,
                    value: attemptJsonParsing(value)
                }

                sub.next(makeMetaEvent(event))
            })

            const ctx: StreamContext= {
                name,
                stateManager
            }

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

/** Converts an RXJS Subject into a Stream object */
export function streamFromSubject<E>(ctx: StreamContext, subj: Subject<MetaEvent<E>>): Stream<E> {
    const stream = subj as any

    Object.assign(
        stream,
        initFactory<E>(stream),
        sinksFactory<E>(stream),
        // windowsFactory<E>(stream),
        // joinFactory<E>(stream),
        mergeFactory<E>(stream),
        operatorsFactory<E>(stream),
        { name: () => ctx.name },
        { ctx }
    )

    //experimental
    // Object.freeze(stream) //conflicting with rxjs subject

    streamPool[ctx.name] = stream as Stream<E>
    return stream as Stream<E>
}

/** Just Typescript sintactic sugar to parse a Stream into a RxJs Subject */
export function subjectFromStream<E>(stream: Stream<E>) {
    return (stream as unknown) as Subject<MetaEvent<E>>
}