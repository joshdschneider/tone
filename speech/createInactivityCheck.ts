import { InactivityCheck, InactivityCheckConstructor } from './InactivityCheck';

export function createInactivityCheck(props: InactivityCheckConstructor) {
  return new InactivityCheck(props);
}
