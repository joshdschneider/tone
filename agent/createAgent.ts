import { Agent, AgentConstructor } from './Agent';

export function createAgent(props: AgentConstructor) {
  console.log('AGENT PROPS', props);
  return new Agent(props);
}
