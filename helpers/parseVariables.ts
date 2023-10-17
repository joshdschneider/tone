import { Variable } from '../types';
import { captureException } from './captureException';

export function parseVariables(variables: string | null): Variable[] {
  if (!variables) {
    return [];
  }
  try {
    return JSON.parse(variables);
  } catch (err) {
    captureException(err);
    return [];
  }
}
