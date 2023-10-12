import { LiveTranscriptionOptions } from '@deepgram/sdk/dist/types';
import { Transcriber } from './Transcriber';

export type TranscriberOptions = {
  language?: string; // BCP-47 language tag
  keywords?: string | string[];
};

export function createTranscriber(options: TranscriberOptions) {
  const opts: LiveTranscriptionOptions = {
    model: '2-ea',
    tier: 'nova',
    punctuate: true,
    endpointing: true,
    interim_results: true,
    encoding: 'linear16',
    sample_rate: 16000,
  };

  if (options.language) {
    opts.language = options.language;
    opts.model = 'general';
  }

  if (options.keywords) {
    opts.keywords = options.keywords;
  }

  return new Transcriber(opts);
}
