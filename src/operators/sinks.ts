import { streamFromSubject, subjectFromStream } from "../tools/stream"
import { MetaEvent } from "../tools/event";
import { Stream } from "../tools/stream";
import { Logger } from "../tools/logger";
import { EventEmitter } from "events"
import { Producer } from "kafkajs"
import { Subject } from "rxjs"

/**/
export type KeyExtractor<E> = (event: E) => string | number

export type ValueExtractor<E> = (event: E) => any

export type Sinks<E> = {
    /**Send stream output to a kafka broker on a specific topic (if a key is not specified, the event key will be used as message key)*/
    toKafka: (producer: Producer, topic: string, keyFrom: KeyExtractor<E>, valueFrom?: ValueExtractor<E>) => Stream<E>
    /**Trigger an event passing the stream output (if a name is not specified, the event key will be used as event name)*/
    toEvent: (emitter: EventEmitter, name: string) => Stream<E>
}

export function sinksFactory<E>(source: Stream<E>): Sinks<E> {
    return {
        toKafka(producer: Producer, topic: string, keyFrom?: KeyExtractor<E>) {
            const subj = new Subject<MetaEvent<E>>()
            subjectFromStream(source).subscribe({
                async next(event) {
                    const key = keyFrom ? keyFrom(event.spec).toString() : event.metadata.key
                    const value = stringifyValue(event.spec)

                    await producer.send({
                        topic, messages: [{
                            key,
                            value
                        }]
                    })

                    Logger(source.ctx).info(`released Kafka event - topic: ${topic} - key: ${key}`)

                    subj.next(event)
                }
            })

            return streamFromSubject(source.ctx, subj)
        },

        toEvent(emitter: EventEmitter, name?: string) {
            const subj = new Subject<MetaEvent<E>>()
            subjectFromStream(source).subscribe({
                async next(event) {
                    emitter.emit(name || event.metadata.key, event.spec)
                    subj.next(event)
                }
            })

            return streamFromSubject(source.ctx, subj)
        }
    }
}

function stringifyValue(value: any): string {
    try {
        return JSON.stringify(value)
    } catch (err) {
        return value.toString()
    }
}