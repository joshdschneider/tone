import { CallDirection, CallSettings } from '../types';

export function getGreeting(callDirection: CallDirection, callSettings: CallSettings | null) {
  if (!callSettings) {
    return undefined;
  }

  const { custom_outbound_greeting_enabled, custom_inbound_greeting, custom_outbound_greeting } =
    callSettings;

  if (callDirection === CallDirection.INBOUND) {
    return custom_outbound_greeting_enabled && custom_inbound_greeting
      ? custom_inbound_greeting
      : undefined;
  } else {
    return custom_outbound_greeting ? custom_outbound_greeting : undefined;
  }
}
