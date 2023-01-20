import { Stream } from "./stream"

type Pool = {
    /**Retrieve a stream from the pool. The type of the stream has to be explicitly passed, since the stream is pushed in the pool at runtime*/
    getStream: <T>(name: string) => Stream<T>
    /**Return the list of all the streams names*/
    list: () => string[]
}

export const streamPool: { [name: string]: Stream<any> } = {}

/**The Stream Pool collects all the streams created by the current process*/
export function Pool(): Pool {
    return {
        /**Get a stream from the stream pool*/
        getStream<E>(name: string) { return streamPool[name] as Stream<E> },

        /**Get the list of stream names from the stream pool*/
        list: (): string[] => Object.keys(streamPool)
    }
}
