import { EventEmitter } from 'events';
import { captureException } from '../helpers/captureException';
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
import { delay } from '../utils/delay';
import { LogLevel, log } from '../utils/log';
import { now } from '../utils/now';

export type SpeechConstructor = {
  voiceOptions?: VoiceOptions;
  voiceProvider?: VoiceProvider;
  language?: string;
};

export abstract class Speech extends EventEmitter {
  public synthesizer: Synthesizer;
  public pregenerated?: boolean;
  private timestamp: number;
  private queue: SynthesisChunk[];
  private isProcessing: boolean;
  private playbackInterval: number;

  constructor({ voiceProvider, voiceOptions, language }: SpeechConstructor) {
    super();
    this.synthesizer = createSynthesizer({ voiceProvider, voiceOptions, language });
    this.synthesizer.on('chunk', (chunk: SynthesisChunk) => this.handleSynthesisChunk(chunk));
    this.synthesizer.on('done', () => this.handleSynthesisDone());
    this.synthesizer.on('error', (err: any) => this.handleSynthesisError(err));
    this.queue = [];
    this.isProcessing = false;
    this.playbackInterval = 20;
    this.timestamp = now();
  }

  public enqueue(chunk: SynthesisChunk) {
    log(`Enqueueing speech chunk`);
    this.queue.push(chunk);
    if (!this.isProcessing && !this.pregenerated) {
      this.dequeue();
    }
  }

  private dequeue() {
    if (this.queue.length === 0) {
      log(`Stopping speech queue`);
      this.isProcessing = false;
      return;
    }

    log(`Dequeueing speech chunk`);
    this.isProcessing = true;
    const chunk = this.queue.shift();
    if (chunk) {
      this.process(chunk)
        .then(() => this.dequeue())
        .catch((err) => {
          log('Error processing speech chunk', LogLevel.ERROR);
          captureException(err);
          this.emit('error', err);
        });
    }
  }

  private async process(chunk: SynthesisChunk) {
    log(`Processing speech chunk: ${JSON.stringify({ ...chunk, audio: chunk.audio.length })}`);
    if (chunk.text) {
      this.emit('message', {
        role: Role.ASSISTANT,
        content: chunk.text,
        start: this.timestamp,
        end: now(),
      });
    }

    let segmentsEmitted = 0;
    for (let offset = 0; offset < chunk.audio.length; offset += 640) {
      if (!this.isProcessing) {
        return;
      }

      let speech = chunk.audio.subarray(offset, offset + 640);
      if (speech.length < 640) {
        continue;
      }

      this.emit('speech', speech);
      segmentsEmitted++;
      if (segmentsEmitted > 2) {
        await delay(this.playbackInterval);
      }
    }

    if (chunk.isFinal) {
      this.emit('done');
    }
  }

  public dequeuePregenerated() {
    log(`Dequeueing pregenerated greeting`);
    this.pregenerated = false;
    this.dequeue();
  }

  public synthesize(textChunk: TextChunk, cache?: CacheOptions) {
    if (cache) {
      log(`Attempting synthesis from cache`);
      // attempt cache
    }

    this.synthesizer.enqueueInput(textChunk);
  }

  private handleSynthesisChunk(chunk: SynthesisChunk) {
    log(`Handling synthesis chunk`);
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
    this.queue.length = 0;
    this.isProcessing = false;
    this.synthesizer.destroy();
    this.removeAllListeners();
  }
}
