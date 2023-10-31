import { ActionFunction } from '../types';

const DEFAULT_ACTION_FUNCTIONS: ActionFunction[] = [
  {
    action_id: 'default',
    name: 'end_call',
    description: `End the call and hang up the phone. Call this function when conversation is over and the human has used a closing phrase like "Goodbye" or "Take care".`,
    hoist_final_response: true,
    parameters: { type: 'object', properties: {} },
  },
  {
    action_id: 'default',
    name: 'hold_call',
    description: `Place the call on hold. Call this function when the human asks you to hold or wait.`,
    hoist_final_response: true,
    parameters: { type: 'object', properties: {} },
  },
  {
    action_id: 'default',
    name: 'detect_voicemail',
    description: `Detect if the current call went to voicemail. Call this function if responses are coming from an answering machine. Look for common voice mail system phrases like "You have reached the voicemail", "Leave a message after the tone", "This call has been forwarded to an automated voice message system", etc.`,
    hoist_final_response: true,
    parameters: { type: 'object', properties: {} },
  },
];

export function getActionFunctions(functions?: ActionFunction[]) {
  if (functions && functions.length) {
    return [...DEFAULT_ACTION_FUNCTIONS, ...functions];
  } else {
    return DEFAULT_ACTION_FUNCTIONS;
  }
}
