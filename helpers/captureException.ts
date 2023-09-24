import * as Sentry from '@sentry/node';

export function captureException(err: any) {
  console.error(err);
  Sentry.captureException(err);
}
