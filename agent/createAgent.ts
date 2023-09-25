import { Agent } from './Agent';

export type CreateAgentProps = {
  id: string;
  prompt: string;
  greeting: string;
  voicemail?: string;
  functions?: string;
};

export function createAgent({ id, prompt, greeting, voicemail, functions }: CreateAgentProps) {
  return new Agent({ id, prompt, greeting, voicemail, functions });
}
