import { Split } from '../generator/Generator';
import { createGenerator } from '../generator/createGenerator';
import { ActionFunction, Message } from '../types';
import { log } from '../utils/log';
import { Speech, SpeechConstructor } from './Speech';

export type ResponseConstructor = {
  messages: Message[];
  prompt?: string;
  functions?: ActionFunction[];
  split?: Split;
} & SpeechConstructor;

export class Response extends Speech {
  private generator;

  constructor({
    messages,
    prompt,
    functions,
    split,
    voiceProvider,
    voiceOptions,
  }: ResponseConstructor) {
    super({ voiceProvider, voiceOptions });
    this.generator = createGenerator({ messages, prompt, functions, split });
    this.generator.on('text', (text) => this.handleText(text));
    this.generator.on('function_call', (func) => this.handleFunctionCall(func));
    this.generator.on('done', () => this.handleGeneratorDone());
    this.generator.on('error', (err) => this.handleError(err));
    this.generator.generate();
  }

  private handleText(text: string) {
    this.synthesize(text);
  }

  private handleFunctionCall(func: ActionFunction) {
    log('Function call generated');
  }

  private handleGeneratorDone() {
    log('Generator done');
  }

  public destroy(): void {
    log(`Destroying response`);
    this.generator.destroy();
    super.destroy();
  }
}
