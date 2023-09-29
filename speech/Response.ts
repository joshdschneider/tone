import { Split } from '../generator/Generator';
import { createGenerator } from '../generator/createGenerator';
import { Message } from '../types';
import { log } from '../utils/log';
import { Speech, SpeechConstructor } from './Speech';

export type ResponseConstructor = {
  messages: Message[];
  split?: Split;
} & SpeechConstructor;

export class Response extends Speech {
  private generator;

  constructor({ messages, split, voiceProvider, voiceOptions }: ResponseConstructor) {
    super({ voiceProvider, voiceOptions });
    this.generator = createGenerator({ messages, split });
    this.generator.on('text', (text) => this.handleText(text));
    this.generator.on('function_call', (payload) => this.handleFunctionCall(payload));
    this.generator.generate();
  }

  private handleText(text: string) {
    this.synthesize(text);
  }

  private handleFunctionCall(fn: any) {
    // ..
  }

  public destroy(): void {
    log(`Destroying response`);
    this.generator.destroy();
    super.destroy();
  }
}
