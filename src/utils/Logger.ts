import { appendFileSync, writeFileSync } from "fs"

export type LoggerOptions = {
    toConsole?: boolean,
    toFile?: string
}

export class WinRxlogger {
    private toConsole: boolean = false
    private toFile: string = undefined

    constructor(options: LoggerOptions) {
        this.toConsole = options?.toConsole || false
        this.toFile = options?.toFile || undefined
        this.toFile && writeFileSync(this.toFile, "")
    }

    info(...args: any[]) {
        this.print("[info]", ...args)
    }

    error(...args: any[]) {
        this.print("[error]", ...args)
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

    "\x1b[36m"

    private print(prefix: string, ...args: any[]) {
        const date = new Date().toISOString()
        if (this.toFile) appendFileSync(this.toFile, `${date} :: ` + prefix + " :: " + args.join(" ") + "\n")
        if (this.toConsole) {
            const coloredPrefix = prefix == "[info]" ? this.green(prefix) :
                prefix == "[error]" ? this.red(prefix) : this.yellow(prefix)
            const consoleText = this.purple(date) + this.white(` :: `) + coloredPrefix + this.white(" :: ") + this.white(args.join(" ") + "\n")
            process.stdout.write(consoleText)
        }
    }
}