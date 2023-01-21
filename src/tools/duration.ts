import dayjs from "dayjs"
import duration, { DurationUnitType } from 'dayjs/plugin/duration'
dayjs.extend(duration)

export type Duration = [number, DurationUnitType] | number

export function toMs(duration?: Duration) {
    if (!duration) return 0
    if (typeof duration == "number") return duration
    return dayjs.duration(...duration).asMilliseconds()
}
