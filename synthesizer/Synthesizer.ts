import { EventEmitter } from 'ws';
import { VoiceProvider } from '../types';

export type SynthesizerConstructor = {
  provider: VoiceProvider;
  voiceId: string;
  model: string;
};

export class Synthesizer extends EventEmitter {
  constructor({ provider, voiceId, model }: SynthesizerConstructor) {
    super();
    //..
  }

  public send(text: string) {
    //..
  }

  public cancel() {
    //..
  }

  public destroy() {
    //..
  }
}
