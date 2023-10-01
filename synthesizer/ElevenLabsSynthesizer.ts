import { ElevenLabsOptions } from '../types';
import { log } from '../utils/log';
import { SynthesisOptions, Synthesizer } from './Synthesizer';

export enum ElevenLabsModel {
  MULTILINGUAL_V2 = 'eleven_multilingual_v2',
  MULTILINGUAL_V1 = 'eleven_multilingual_v1',
  ENGLISH_V1 = 'eleven_monolingual_v1',
}
//   const english = !language || language === 'en-US';
//   const model = english ? ElevenLabsModel.ENGLISH_V1 : ElevenLabsModel.MULTILINGUAL_V1;

//   return new Synthesizer({
//     provider,
//     model,
//     voiceId,
//     stability: 0.9,
//     similarityBoost: 0.75,
//     optimizeStreamingLatency: 2,
//   });

export class ElevenLabsSynthesizer extends Synthesizer {
  constructor(options: ElevenLabsOptions) {
    super();
  }

  public synthesize(text: string, opts?: SynthesisOptions): void {
    //..
  }

  public destroy(): void {
    log(`Destroying ElevenLabs synthesizer`);
    this.removeAllListeners();
  }
}
