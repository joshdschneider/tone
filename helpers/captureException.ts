import * as Sentry from '@sentry/node';
import { LogLevel, log } from '../utils/log';

export function captureException(err: any) {
  log(err, LogLevel.ERROR);
  Sentry.captureException(err);
}
