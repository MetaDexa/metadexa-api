import { existsSync, mkdirSync } from 'fs';
import { Logger, createLogger, format, transports } from 'winston';

const logDir = './logs';

if (!existsSync(logDir)) {
	mkdirSync(logDir);
}

const { combine, timestamp, prettyPrint, json } = format;
const logger: Logger = createLogger({
	format: combine(timestamp(), json()),
	level:
		process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'dev'
			? 'debug'
			: 'info',
	transports: [
		new transports.Console({ format: prettyPrint() }),
		new transports.File({ filename: `${logDir}/combined.log` }),
	],
});

export default logger;
