import { Recovery, RecoveryConstructor } from './Recovery';

export function createRecovery(props: RecoveryConstructor) {
  return new Recovery(props);
}
