import { StateMachine, StateMachineConstructor } from './StateMachine';

export function createStateMachine(props: StateMachineConstructor) {
  return new StateMachine(props);
}
