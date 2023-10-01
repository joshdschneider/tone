import { EventEmitter } from 'events';
import { SynthesisOptions, Synthesizer } from '../synthesizer/Synthesizer';
import { createSynthesizer } from '../synthesizer/createSynthesizer';
import { SynthesisChunk, VoiceOptions, VoiceProvider } from '../types';
import { LogLevel, log } from '../utils/log';
import { now } from '../utils/now';

export type SpeechConstructor = {
  voiceOptions?: VoiceOptions;
  voiceProvider?: VoiceProvider;
};

export abstract class Speech extends EventEmitter {
  private synthesizer: Synthesizer;
  private timestamp: number;

  constructor({ voiceProvider, voiceOptions }: SpeechConstructor) {
    super();
    this.synthesizer = createSynthesizer({ voiceProvider, voiceOptions });
    this.synthesizer.on('speech', (chunk) => this.handleSynthesisChunk(chunk));
    this.synthesizer.on('done', () => this.handleSynthesisDone());
    this.synthesizer.on('error', (err) => this.handleError(err));
    this.timestamp = now();
  }

  public synthesize(text: string, options?: SynthesisOptions) {
    this.synthesizer.synthesize(text, options);
  }

  private handleSynthesisChunk(chunk: SynthesisChunk) {
    this.emit('speech', {
      ...chunk,
      start: this.timestamp,
      end: now(),
    });
  }

  private handleSynthesisDone() {
    log('Synthesis done');
    this.emit('done');
  }

  public handleError(err: any) {
    log('Speech error', LogLevel.ERROR);
    this.emit('error', err);
  }

  public destroy() {
    log(`Destroying speech`);
    this.synthesizer.destroy();
    this.removeAllListeners();
  }
}
