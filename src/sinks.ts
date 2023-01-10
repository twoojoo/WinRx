import { Producer } from "kafkajs"
import { Observable, Subject } from "rxjs"
import { streamFromSubject } from "./utils/parseStream"
import { Stream } from "./windows/types/Stream"
import { EventEmitter } from "events"

type KeyExtractor<T> = (event: T) => string | number
type ValueExtractor<T> = (event: T) => any

export type Sinks<T> = {
    toKafka: (producer: Producer, topic: string, keyFrom: KeyExtractor<T>, valueFrom?: ValueExtractor<T>) => Stream<T>
    toEvent: (emitter: EventEmitter, name: string) => Stream<T>
}

export function sinks<T>(source: Observable<T>): Sinks<T> {
    return {
        toKafka(producer: Producer, topic: string, keyFrom: KeyExtractor<T>, valueFrom: ValueExtractor<T> = e => e) {
            const subj = new Subject()
            source.subscribe({
                async next(event) {
                    const key = keyFrom(event).toString()
                    const value = stringifyValue(valueFrom(event))

                    producer.send({
                        topic, messages: [{
                            key,
                            value
                        }]
                    })
                }
            })

            return streamFromSubject(subj) as Stream<T>
        },

        toEvent(emitter: EventEmitter, name: string) {
            const subj = new Subject()
            source.subscribe({
                async next(event) {
                    emitter.emit(name, event)
                }
            })

            return streamFromSubject(subj) as Stream<T>
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