import { DEFAULT_GREETING } from '../utils/constants';
import { log } from '../utils/log';
import { Speech, SpeechConstructor } from './Speech';

export type GreetingConstructor = {
  greeting?: string;
  agentId: string;
} & SpeechConstructor;

export class Greeting extends Speech {
  constructor({ greeting, agentId, voiceOptions, voiceProvider }: GreetingConstructor) {
    super({ voiceOptions, voiceProvider });
    if (!greeting) {
      log(`Synthesizing default greeting`);
      this.synthesize(DEFAULT_GREETING);
    } else {
      log(`Synthesizing greeting`);
      this.synthesize(greeting, {
        fromCache: true,
        cacheKey: `greeting:${agentId}`,
      });
    }
  }
}
