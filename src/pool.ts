import { Stream } from "./stream"

type Pool = {
    get: <T>(name: string) => Stream<T>
    list: () => string[]
}

export const streamPool: { [name: string]: Stream<any> } = {}

export function Pool(): Pool {
    return {
        get<T>(name: string) { return streamPool[name] as Stream<T> },
        list: () => Object.keys(streamPool)
    }
}
