const isDevelopment = process.env.NODE_ENV === 'development';

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export function log(message: string, level?: LogLevel) {
  if (isDevelopment) {
    switch (level) {
      case LogLevel.INFO:
        console.info(`[INFO]: ${message}`);
        break;
      case LogLevel.WARN:
        console.warn(`[WARN]: ${message}`);
        break;
      case LogLevel.ERROR:
        console.error(`[ERROR]: ${message}`);
        break;
      default:
        console.log(`[LOG]: ${message}`);
    }
  }
}
