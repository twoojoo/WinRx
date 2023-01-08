import { appendFileSync, writeFileSync } from "fs"

export type LoggerOptions = {
    toConsole?: boolean,
    toFile?: string
}

export class WinRxlogger {
    private windowId: string | number
    private toConsole: boolean = false
    private toFile: string = undefined

    constructor(options: LoggerOptions, windowId: string | number) {
        this.windowId = windowId
        this.toConsole = options?.toConsole || false
        this.toFile = options?.toFile || undefined
        this.toFile && writeFileSync(this.toFile, "")
    }

    info(...args: any[]) {
        this.print("[info]   ", ...args)
    }

    error(...args: any[]) {
        this.print("[error]  ", ...args)
    }

    warning(...args: any[]) {
        this.print("[warning]", ...args)
    }

    white(...args: any[]): string {
        return "\x1b[37m" + args.join(" ") + "\x1b[0m"
    }

    green(...args: any[]): string {
        return "\x1b[32m" + args.join(" ") + "\x1b[0m"
    }

    red(...args: any[]): string {
        return "\x1b[31m" + args.join(" ") + "\x1b[0m"
    }

    yellow(...args: any[]): string {
        return "\x1b[33m" + args.join(" ") + "\x1b[0m"
    }

    purple(...args: any[]): string {
        return "\x1b[35m" + args.join(" ") + "\x1b[0m"
    }

    cyan(...args: any[]): string {
        return "\x1b[36m" + args.join(" ") + "\x1b[0m"
    }

    private print(prefix: string, ...args: any[]) {
        const date = new Date().toISOString()

        if (this.toFile) appendFileSync(this.toFile, `${date} :: ` + prefix + " :: " + this.windowId + " :: " + args.join(" ") + "\n")

        if (this.toConsole) {
            const coloredPrefix = prefix == "[info]   " ? this.green(prefix) :
                prefix == "[error]  " ? this.red(prefix) : this.yellow(prefix)

            const consoleText =
                this.purple(date) +
                this.white(` | `) +
                coloredPrefix +
                this.white(" | [win: ") +
                this.cyan(this.windowId) +
                this.white("] | ") +
                this.white(args.join(" ") + "\n")

            process.stdout.write(consoleText)
        }
    }

    printHeader() {
        if (!this.toConsole) return
        const consoleText = this.white(
            "datetime                ",
            "|",
            "kind     ",
            "|",
            "window  ",
            "|",
            "action           ",
            "|",
            "spec",
            "\n"
        )

        process.stdout.write("\n")
        process.stdout.write(consoleText)
        process.stdout.write(this.white("---------------------------------------------------------------------------------------------------------------------------------------------\n"))
    }                                                                                                                                                                                 
}