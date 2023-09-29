import { VoiceOptions, VoiceProvider } from '../types';
import { createElevenLabsSynthesizer } from './createElevenLabsSynthesizer';

export type CreateSynthesizerProps = {
  voiceProvider?: VoiceProvider;
  voiceOptions?: VoiceOptions;
};

const DEFAULT = {
  provider: VoiceProvider.ELEVENLABS,
  options: {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    stability: 0.9,
    similarity_boost: 0.75,
  },
};

export function createSynthesizer({ voiceProvider, voiceOptions }: CreateSynthesizerProps) {
  const provider = voiceProvider || DEFAULT.provider;
  const options = voiceOptions || DEFAULT.options;

  switch (provider) {
    case VoiceProvider.ELEVENLABS:
      return createElevenLabsSynthesizer(options);

    default:
      throw new Error(`Voice provider ${voiceProvider} not supported`);
  }
}
