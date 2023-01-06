import { WinRxlogger } from "../src/utils/Logger"

const logger = new WinRxlogger({
    toConsole: true,
    toFile: __dirname + "/test.log"
})

logger.info("this is an info log")
logger.error("this is an error log")
logger.warning("this is a warning log")