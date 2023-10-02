import { EventEmitter } from 'events';
import { Synthesizer } from '../synthesizer/Synthesizer';
import { createSynthesizer } from '../synthesizer/createSynthesizer';
import {
  CacheOptions,
  Role,
  SynthesisChunk,
  TextChunk,
  VoiceOptions,
  VoiceProvider,
} from '../types';
import { LogLevel, log } from '../utils/log';
import { now } from '../utils/now';

export type SpeechConstructor = {
  voiceOptions?: VoiceOptions;
  voiceProvider?: VoiceProvider;
  language?: string;
};

export abstract class Speech extends EventEmitter {
  public synthesizer: Synthesizer;
  private timestamp: number;
  private queue: SynthesisChunk[];
  private isProcessing: boolean;

  constructor({ voiceProvider, voiceOptions, language }: SpeechConstructor) {
    super();
    this.synthesizer = createSynthesizer({ voiceProvider, voiceOptions, language });
    this.synthesizer.on('chunk', (chunk: SynthesisChunk) => this.handleSynthesisChunk(chunk));
    this.synthesizer.on('done', () => this.handleSynthesisDone());
    this.synthesizer.on('error', (err: any) => this.handleSynthesisError(err));
    this.queue = [];
    this.isProcessing = false;
    this.timestamp = now();
  }

  public enqueue(chunk: SynthesisChunk) {
    log(`Enqueueing synthesis chunk`);
    this.queue.push(chunk);
    if (!this.isProcessing) {
      this.dequeue();
    }
  }

  private dequeue() {
    log(`Dequeueing synthesis chunk`);
    if (this.queue.length === 0) {
      log(`Stopping synthesis queue`);
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const chunk = this.queue.shift();
    if (chunk) {
      this.process(chunk);
      this.dequeue();
    }
  }

  private process(chunk: SynthesisChunk) {
    log(`Processing synthesis chunk`);
    if (chunk.text) {
      this.emit('message', {
        role: Role.ASSISTANT,
        text: chunk.text,
        start: this.timestamp,
        end: now(),
      });
    }

    const buffer = chunk.audio;
    for (let i = 0; i < buffer.length; i += 640) {
      const speech = buffer.subarray(i, i + 640);
      this.emit('speech', speech);
    }

    if (chunk.isFinal) {
      this.emit('done');
    }
  }

  public synthesize(textChunk: TextChunk, cache?: CacheOptions) {
    if (cache) {
      log(`Attempting synthesis from cache`);
      // attempt cache
    }

    if (textChunk.text) {
      this.synthesizer.synthesize(textChunk.text);
    }

    if (textChunk.isFinal) {
      this.synthesizer.finish();
    }
  }

  private handleSynthesisChunk(chunk: SynthesisChunk) {
    log(`Synthesis chunk received`);
    this.enqueue(chunk);
  }

  private handleSynthesisDone() {
    log('Synthesis done');
  }

  private handleSynthesisError(err: any) {
    log('Synthesis error', LogLevel.ERROR);
    this.emit('error', err);
  }

  public destroy() {
    log(`Destroying speech`);
    this.synthesizer.destroy();
    this.removeAllListeners();
  }
}
