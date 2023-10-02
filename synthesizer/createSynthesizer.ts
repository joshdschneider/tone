import { VoiceOptions, VoiceProvider } from '../types';
import { createElevenLabsSynthesizer } from './createElevenLabsSynthesizer';

export type CreateSynthesizerProps = {
  voiceProvider?: VoiceProvider;
  voiceOptions?: VoiceOptions;
  language?: string;
};

const DEFAULT_VOICE_PROVIDER = VoiceProvider.ELEVENLABS;

export function createSynthesizer({
  voiceProvider,
  voiceOptions,
  language,
}: CreateSynthesizerProps) {
  const provider = voiceProvider || DEFAULT_VOICE_PROVIDER;

  switch (provider) {
    case VoiceProvider.ELEVENLABS:
      return createElevenLabsSynthesizer({ voiceOptions, language });

    default:
      throw new Error(`Voice provider ${voiceProvider} not supported`);
  }
}
