import { WinRxlogger } from "../src/windows/Utils/Logger"

const logger = new WinRxlogger({
    toConsole: true,
    toFile: __dirname + "/test.log"
}, "2")

logger.info("this is an info log")
logger.error("this is an error log")
logger.warning("this is a warning log")