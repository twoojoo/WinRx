import { StreamContext } from "./stream"

export function Logger(ctx: StreamContext) {
	const date = new Date().toISOString()

	return {
		info(message: string) {
			if (!ctx.logger) return
			process.stdout.write(`[INFO - ${ctx.name} - ${date}] #> ${message}\n`)
		},

		warning(message: string) {
			if (!ctx.logger) return
			process.stdout.write(`[WARNING - ${ctx.name} - ${date}] #> ${message}\n`)
		},

		error(message: string) {
			if (!ctx.logger) return
			process.stdout.write(`[ERROR - ${ctx.name} - ${date}] #> ${message}\n`)
		}
	}
}