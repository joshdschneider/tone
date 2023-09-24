import { EventEmitter } from 'stream';
import { Synthesizer } from '../synthesizer/Synthesizer';

export type AgentConstructor = {
  prompt: string;
  greeting: string;
  voicemail?: string;
  functions?: string;
  synthesizer: Synthesizer;
};

export class Agent extends EventEmitter {
  constructor({ prompt, greeting, voicemail, functions, synthesizer }: AgentConstructor) {
    super();
  }
}
