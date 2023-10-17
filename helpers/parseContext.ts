import { captureException } from './captureException';

export function parseContext(context: string | null): any {
  if (!context) {
    return null;
  }
  try {
    return JSON.parse(context);
  } catch (err) {
    captureException(err);
    return null;
  }
}
