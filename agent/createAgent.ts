import { Synthesizer } from '../synthesizer/Synthesizer';
import { Agent } from './Agent';

export type CreateAgentProps = {
  prompt: string;
  greeting: string;
  voicemail?: string;
  functions?: string;
  synthesizer: Synthesizer;
};

export function createAgent({
  prompt,
  greeting,
  voicemail,
  functions,
  synthesizer,
}: CreateAgentProps) {
  return new Agent({
    prompt,
    greeting,
    voicemail,
    functions,
    synthesizer,
  });
}
