import { ActionFunction } from '../types';

const DEFAULT_ACTION_FUNCTIONS: ActionFunction[] = [
  {
    action_id: 'default',
    name: 'end_call',
    description: 'Hang up the phone when the call is over.',
    hoist_final_response: true,
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    action_id: 'default',
    name: 'hold_call',
    description: 'Place the call on hold.',
    hoist_final_response: true,
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

export function getActionFunctions(functions?: ActionFunction[]) {
  if (functions && functions.length) {
    return [...DEFAULT_ACTION_FUNCTIONS, ...functions];
  } else {
    return DEFAULT_ACTION_FUNCTIONS;
  }
}
