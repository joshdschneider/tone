import { captureException } from '../helpers/captureException';
import { RimeOptions } from '../types';
import { LogLevel, log } from '../utils/log';
import { Synthesizer } from './Synthesizer';

export enum OutputFormat {
  PCM_16000 = 'pcm_16000',
}

export type RimeSynthesizerConstructor = {
  voiceOptions?: RimeOptions;
  language?: string;
};

const DEFAULT_OPTIONS = {
  speaker: 'rose',
  speedAlpha: 1.0,
};

const RIME_API_KEY = process.env.RIME_API_KEY as string;

type Item = {
  text: string;
};

export class RimeSynthesizer extends Synthesizer {
  private options: RimeOptions;
  private queue: Item[];
  private isProcessing: boolean;

  constructor({ voiceOptions, language }: RimeSynthesizerConstructor) {
    super();
    this.options = voiceOptions || DEFAULT_OPTIONS;
    this.queue = [];
    this.isProcessing = false;
    this.startInputProcessing();
  }

  public synthesize(text: string): void {
    log(`Enqueueing text ${text}`);
    this.enqueue({ text });
  }

  private enqueue(item: Item) {
    log(`Dequeueing text for synthesis`);
    this.queue.push(item);
    if (!this.isProcessing) {
      this.dequeue();
    }
  }

  private dequeue() {
    if (this.queue.length === 0) {
      log(`Empty input queue`);
      return;
    }

    this.isProcessing = true;
    const item = this.queue.shift();
    if (item) {
      this.process(item)
        .then(() => this.dequeue())
        .catch((err) => {
          log('Error processing synthesis chunk', LogLevel.ERROR);
          captureException(err);
          this.emit('error', err);
        });
    }
  }

  private async process(item: Item) {
    log(`Processing text to speech`);

    try {
      const res = await fetch('https://api.rime.ai/functions/v1/rime-tts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RIME_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: item.text,
          speaker: this.options.speaker,
          audioFormat: 'wav',
          samplingRate: 16000,
          speedAlpha: this.options.speedAlpha,
        }),
      });

      const data = await res.json();
      const buffer = Buffer.from(data.audioContent, 'base64');
      const trimmed = buffer.subarray(50);

      this.enqueueOutput({ audio: trimmed, text: item.text });
    } catch (err) {
      console.log(err);
    }
  }

  public finish() {
    //..
  }

  public destroy(): void {
    log(`Destroying Rime synthesizer`);
    super.destroy();
  }
}
