import { VoiceProvider } from '../types';

export type SynthesizerConstructor = {
  provider: VoiceProvider;
  voiceId: string;
  model: string;
};

export class Synthesizer {
  constructor({ provider, voiceId, model }: SynthesizerConstructor) {
    //..
  }
}
