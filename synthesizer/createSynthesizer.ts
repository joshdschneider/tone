import { VoiceProvider } from '../types';
import { Synthesizer } from './Synthesizer';

export type CreateSynthesizerProps = {
  provider: VoiceProvider;
  voiceId: string;
  language?: string;
};

export enum ElevenLabsModel {
  MULTILINGUAL_V2 = 'eleven_multilingual_v2',
  MULTILINGUAL_V1 = 'eleven_multilingual_v1',
  ENGLISH_V1 = 'eleven_monolingual_v1',
}

export function createSynthesizer({ provider, voiceId, language }: CreateSynthesizerProps) {
  const english = !language || language === 'en-US';
  const model = english ? ElevenLabsModel.ENGLISH_V1 : ElevenLabsModel.MULTILINGUAL_V2;
  return new Synthesizer({ provider, voiceId, model });
}
