import { Stream } from "./stream"

type Pool = {
    getStream: <T>(name: string) => Stream<T>
    list: () => string[]
}

export const streamPool: { [name: string]: Stream<any> } = {}

export function Pool(): Pool {
    return {
        getStream<T>(name: string) { return streamPool[name] as Stream<T> },
        list: () => Object.keys(streamPool)
    }
}
