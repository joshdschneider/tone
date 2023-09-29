import { EventEmitter } from 'events';
import { SynthesisOptions } from '../synthesizer/Synthesizer';
import { createSynthesizer } from '../synthesizer/createSynthesizer';
import { VoiceOptions, VoiceProvider } from '../types';
import { log } from '../utils/log';

export type SpeechConstructor = {
  voiceOptions?: VoiceOptions;
  voiceProvider?: VoiceProvider;
};

export abstract class Speech extends EventEmitter {
  private synthesizer;

  constructor({ voiceProvider, voiceOptions }: SpeechConstructor) {
    super();
    this.synthesizer = createSynthesizer({ voiceProvider, voiceOptions });
    this.synthesizer.on('speech', (chunk) => this.emit('chunk', chunk));
  }

  public synthesize(text: string, options?: SynthesisOptions) {
    this.synthesizer.synthesize(text, options);
  }

  public destroy() {
    log(`Destroying speech`);
    this.synthesizer.destroy();
    this.removeAllListeners();
  }
}
