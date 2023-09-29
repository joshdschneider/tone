import { LiveTranscriptionOptions } from '@deepgram/sdk/dist/types';
import { Transcriber } from './Transcriber';

export type TranscriberOptions = {
  language?: string; // BCP-47 language tag
  keywords?: string | string[];
};

export function createTranscriber(options: TranscriberOptions) {
  const opts: LiveTranscriptionOptions = {
    model: 'nova-2-ea',
    vad_turnoff: 10,
    punctuate: true,
    endpointing: true,
    interim_results: true,
    encoding: 'linear16',
    sample_rate: 16000,
  };

  if (options.language) {
    opts.language = options.language;
  }

  if (options.keywords) {
    opts.keywords = options.keywords;
  }

  return new Transcriber(opts);
}
