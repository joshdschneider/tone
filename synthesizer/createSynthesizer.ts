import { ElevenLabsOptions, RimeOptions, VoiceOptions, VoiceProvider } from '../types';
import { createElevenLabsSynthesizer } from './createElevenLabsSynthesizer';
import { createRimeSynthesizer } from './createRimeSynthesizer';

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
      return createElevenLabsSynthesizer({
        voiceOptions: voiceOptions as ElevenLabsOptions,
        language,
      });

    case VoiceProvider.ELEVENLABS:
      return createRimeSynthesizer({
        voiceOptions: voiceOptions as RimeOptions,
        language,
      });

    default:
      throw new Error(`Voice provider ${voiceProvider} not supported`);
  }
}
