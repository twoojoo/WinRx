import dayjs from "dayjs"
import duration, { DurationUnitType } from 'dayjs/plugin/duration'
dayjs.extend(duration)

export type Duration = [number, DurationUnitType]

export function toMs(duration: Duration) {
    return dayjs.duration(...duration).asMilliseconds()
}
