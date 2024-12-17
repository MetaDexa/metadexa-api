import { existsSync, mkdirSync } from 'fs';
import { Logger, createLogger, format, transports } from 'winston';

const logDir = './logs';

if (!existsSync(logDir)) {
	mkdirSync(logDir);
}

const { combine, timestamp, prettyPrint, printf } = format;
const extendedLogFormatForFile = combine(timestamp(), prettyPrint());

const extendedLogFormat = printf(
	({ level, message }) => `[${level}] - ${message}`,
);

const logger: Logger = createLogger({
	format: combine(timestamp(), extendedLogFormat),
	level:
		process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'dev'
			? 'debug'
			: 'info',
	transports: [
		new transports.Console({ format: extendedLogFormat }),
		new transports.File({
			filename: `${logDir}/combined.log`,
			format: extendedLogFormatForFile,
		}),
	],
});

export default logger;
