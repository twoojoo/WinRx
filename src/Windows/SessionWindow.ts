import { Observer, Subscriber } from "rxjs"
import { Event, EventKey } from "../models/Event"
import { Bucket } from "../models/Bucket"
import { Window, WindowOptions } from "../models/Window"

export type SessionWindowOptions<T> = WindowOptions<T> & { size: number, timeout: number }

export class SessionWindow<T> extends Window<T> {
    private maxDuration: number
    private timeoutSize: number

    private buckets: {
        [key: EventKey]: {
            bucket: Bucket<T>
            durationTimer: NodeJS.Timeout,
            timeoutTimer: NodeJS.Timeout
        }[]
    } = {}

    constructor(options: SessionWindowOptions<T>) {
        super(options)

        this.maxDuration = options.size
        this.timeoutSize = options.timeout
    }

    async onStart(observer: Observer<T[]>): Promise<void> {
        return
    }

    async onComplete(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onError(subscriber: Subscriber<T[]>): Promise<void> {
        return
    }

    async onEvent(subscriber: Subscriber<T[]>, event: Event<T>): Promise<void> {
        const eventKey = event.eventKey

        if (!this.buckets[eventKey] || !this.buckets[eventKey][0]) {
            const bucket = new Bucket(this.storage)

            // console.log(bucket.ownsEvent(event))

            this.buckets[eventKey] = []
            this.buckets[eventKey].push({
                bucket,
                durationTimer: setTimeout(async () => await this.closeWindow(subscriber, eventKey, bucket.id), this.maxDuration),
                timeoutTimer: setTimeout(async () => await this.closeWindow(subscriber, eventKey, bucket.id), this.timeoutSize)
            })

            await this.buckets[eventKey][0].bucket.push(event)
        }

        else {
            const owner = this.buckets[eventKey].find(b => b.bucket.ownsEvent(event))
            if (!owner) return

            clearTimeout(owner.timeoutTimer)
            owner.timeoutTimer = setTimeout(async () => await this.closeWindow(subscriber, eventKey, owner.bucket.id), this.timeoutSize)

            await owner.bucket.push(event)
        }
    }

    private async closeWindow(subscriber: Subscriber<T[]>, eventKey: EventKey, windowId: string) {
        this.buckets[eventKey] = this.buckets[eventKey].filter(b => {
            const isTarget = b.bucket.id == windowId

            if (isTarget) {
                b.bucket.close(
                    this.watermark,
                    "flush",
                    events => this.release(subscriber, events)
                )
            }

            return !isTarget
        })
    }
}