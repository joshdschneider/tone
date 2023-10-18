import { Agent, AgentConstructor } from './Agent';

export function createAgent(props: AgentConstructor) {
  return new Agent(props);
}
