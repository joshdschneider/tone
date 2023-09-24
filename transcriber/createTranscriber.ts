import { Transcriber } from './Transcriber';

export type TranscriberOptions = {
  language?: string; // BCP-47 language tag
  keywords?: string | string[];
};

export function createTranscriber(opts: TranscriberOptions) {
  return new Transcriber({
    model: 'nova-2-ea', // Models.General
    // tier: "nova"
    language: opts.language,
    keywords: opts.keywords,
    vad_turnoff: 10, // ??
    punctuate: true,
    endpointing: true,
    interim_results: true,
    encoding: 'linear16',
    sample_rate: 16000,
  });
}
