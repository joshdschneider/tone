import { EventEmitter } from 'events';
import { Message } from '../types';
import { log } from '../utils/log';

export enum Split {
  WORD = 'WORD',
  SENTENCE = 'SENTENCE',
  NONE = 'NONE',
}

export type GeneratorConstructor = {
  messages: Message[];
  split?: Split;
};

export class Generator extends EventEmitter {
  private messages;
  private split;

  constructor({ messages, split }: GeneratorConstructor) {
    super();
    this.messages = messages;
    this.split = split || Split.WORD;
  }

  public generate() {
    //..
  }

  public destroy(): void {
    log(`Destroying generator`);
    this.removeAllListeners();
  }
}
