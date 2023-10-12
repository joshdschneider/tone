import { Split } from '../generator/Generator';
import { getDefaultGreeting } from '../utils/greeting';
import { log } from '../utils/log';
import { Speech, SpeechConstructor } from './Speech';

export type GreetingConstructor = {
  greeting?: string;
  agentId: string;
} & SpeechConstructor;

export class Greeting extends Speech {
  private agentId: string;
  private greeting?: string;

  constructor({ agentId, greeting, voiceOptions, voiceProvider, language }: GreetingConstructor) {
    super({ voiceOptions, voiceProvider, language });
    this.agentId = agentId;
    this.greeting = greeting;
    this.greet();
  }

  private greet() {
    if (!this.greeting) {
      log(`Synthesizing default greeting`);
      this.synthesize({
        text: getDefaultGreeting(this.language),
        split: Split.NONE,
        isFinal: true,
      });
    } else {
      log(`Synthesizing greeting`);
      const chunk = {
        text: this.greeting,
        split: Split.NONE,
        isFinal: true,
      };

      this.synthesize(chunk, {
        key: `greeting:${this.agentId}`,
      });
    }
  }
}
