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

export class RimeSynthesizer extends Synthesizer {
  private options: RimeOptions;

  constructor({ voiceOptions, language }: RimeSynthesizerConstructor) {
    super();
    this.options = voiceOptions || DEFAULT_OPTIONS;
  }

  public async synthesize(text: string): Promise<void> {
    try {
      const res = await fetch('https://api.rime.ai/functions/v1/rime-tts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RIME_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          speaker: this.options.speaker,
          audioFormat: 'wav',
          samplingRate: 16000,
          speedAlpha: this.options.speedAlpha,
        }),
      });

      const data = await res.json();
      const buffer = Buffer.from(data.audioContent, 'base64');
      this.enqueueOutput({ audio: buffer, text });
    } catch (err) {
      captureException(err);
      log('Failed to synthesize Rime', LogLevel.ERROR);
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
