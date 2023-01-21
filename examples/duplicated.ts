import { Stream } from "../src";
import { EventEmitter } from "events"

const emitter = new EventEmitter()

Stream("same-name").fromEvent(emitter, "event1")
Stream("same-name").fromEvent(emitter, "event2")

//should throw an error !!
