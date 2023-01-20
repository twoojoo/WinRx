import { Producer } from "kafkajs"
import { Observable, Subject } from "rxjs"
import { streamFromSubject, subjectFromStream } from "../stream"
import { Stream } from "../stream";
import { EventEmitter } from "events"
import { MetaEvent } from "../event";

type KeyExtractor<T> = (event: T) => string | number
type ValueExtractor<T> = (event: T) => any

export type Sinks<E> = {
    /**Send stream output to a kafka broker on a specific topic*/
    toKafka: (producer: Producer, topic: string, keyFrom: KeyExtractor<E>, valueFrom?: ValueExtractor<E>) => Stream<E>
    /**Trigger an event passing the stream output*/
    toEvent: (emitter: EventEmitter, name: string) => Stream<E>
}

export function sinksFactory<E>(source: Stream<E>): Sinks<E> {
    return {
        toKafka(producer: Producer, topic: string, keyFrom: KeyExtractor<E>, valueFrom: ValueExtractor<E> = e => e) {
            const subj = new Subject<MetaEvent<E>>()
            subjectFromStream(source).subscribe({
                async next(event) {
                    const key = keyFrom(event.value).toString()
                    const value = stringifyValue(valueFrom(event.value))

                    producer.send({
                        topic, messages: [{
                            key,
                            value
                        }]
                    })
                }
            })

            return streamFromSubject(source.name(), subj)
        },

        toEvent(emitter: EventEmitter, name: string) {
            const subj = new Subject<MetaEvent<E>>()
            subjectFromStream(source).subscribe({
                async next(event) {
                    emitter.emit(name, event.value)
                }
            })

            return streamFromSubject(source.name(), subj)
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