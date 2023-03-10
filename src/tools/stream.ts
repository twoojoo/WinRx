import { Subject } from "rxjs";
import { Join, joinFactory } from "../operators/join"
import { Merge, mergeFactory } from "../operators/merge"
import { Operators, operatorsFactory } from "../operators/operators"
import { Sinks, sinksFactory } from "../operators/sinks"
import { Windows, windowsFactory } from "../operators/windows"
import { streamPool } from "./pool";
import { StateManager } from "../state/state-manager";
import { MetaEvent } from "./event";
import { Init, initFactory } from "../operators/init";
import { newMemoryStateManager } from "../state/memory";
import { sourcesFactory, Sources } from "../operators/sources";

export type StreamContext = {
    name: string, //must be uniqued (checked at startup)
    stateManager: StateManager<any>
    logger: boolean,
    windows: string[] //collects stream windows names that must be unique per stream (checked at startup)
}

export type Stream<E> =
    Init<E> &
    Operators<E> &
    Windows<E> &
    Join<E> &
    Merge<E> &
    Sinks<E> &
    { name: () => string } &
    { ctx: StreamContext }

export type StreamOptions = {
    logger?: boolean
    stateManager?: StateManager<any>,
}

/**Create a stream. Use the stream name as unique ideintifier. If a state manager is not provided, the state will be persited in memory.*/
export function Stream<E>(name: string, options: StreamOptions = {}): Sources<E> {
    validateOptions(options)
    const { stateManager, logger } = options

    if (!!streamPool[name]) throw Error(`a stream named "${name}" already exists in the stream pool`)

    //setup stream context
    stateManager.setStreamName(name)
    const ctx: StreamContext = { 
        name, 
        stateManager, 
        windows: [], 
        logger
    }

    return sourcesFactory<E>(ctx)
}

/** Converts an RXJS Subject into a Stream object */
export function streamFromSubject<E>(ctx: StreamContext, subj: Subject<MetaEvent<E>>): Stream<E> {
    const stream = subj as any

    Object.assign(
        stream,
        initFactory<E>(stream),
        sinksFactory<E>(stream),
        windowsFactory<E>(stream),
        joinFactory<E>(stream),
        mergeFactory<E>(stream),
        operatorsFactory<E>(stream),
        { name: () => ctx.name },
        { ctx }
    )

    Object.defineProperty(stream, "name", { writable: false }) 
    // Object.defineProperty(stream, "ctx", { writable: false,  }) 

    streamPool[ctx.name] = stream as Stream<E>
    return stream as Stream<E>
}

/** Just Typescript sintactic sugar to parse a Stream into a RxJs Subject */
export function subjectFromStream<E>(stream: Stream<E>) {
    return (stream as unknown) as Subject<MetaEvent<E>>
}

function validateOptions(opts: StreamOptions) {
    opts.stateManager = opts.stateManager || newMemoryStateManager()
    opts.logger = opts.logger !== false  //default to true
}