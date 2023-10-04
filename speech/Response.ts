import { Split } from '../generator/Generator';
import { createGenerator } from '../generator/createGenerator';
import { ActionFunction, Message, TextChunk } from '../types';
import { LogLevel, log } from '../utils/log';
import { Speech, SpeechConstructor } from './Speech';

export type ResponseConstructor = {
  messages: Message[];
  prompt?: string;
  functions?: ActionFunction[];
  split?: Split;
  pregenerated?: boolean;
} & SpeechConstructor;

export class Response extends Speech {
  private generator?;

  constructor({
    messages,
    prompt,
    functions,
    split,
    voiceProvider,
    voiceOptions,
    pregenerated,
  }: ResponseConstructor) {
    super({ voiceProvider, voiceOptions });
    this.pregenerated = pregenerated;
    this.generator = createGenerator({ messages, prompt, functions, split });
    this.generator.on('text', (chunk: TextChunk) => this.handleTextChunk(chunk));
    this.generator.on('function_call', (func: ActionFunction) => this.handleFunctionCall(func));
    this.generator.on('done', () => this.handleGeneratorDone());
    this.generator.on('error', (err: any) => this.handleGeneratorError(err));
    this.generator.generate();
  }

  private handleTextChunk(textChunk: TextChunk) {
    this.synthesize(textChunk);
  }

  private handleFunctionCall(func: ActionFunction) {
    // TODO
    log('Function call generated');
  }

  private handleGeneratorDone() {
    log('Generator done');
    if (this.generator) {
      this.generator.destroy();
      this.generator = undefined;
    }
  }

  private handleGeneratorError(err: any) {
    log('Generator error', LogLevel.ERROR);
    this.emit('error', err);
  }

  public destroy(): void {
    log(`Destroying response`);
    if (this.generator) {
      this.generator.destroy();
      this.generator = undefined;
    }

    super.destroy();
  }
}
