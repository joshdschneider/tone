import { ElevenLabsSynthesizer, ElevenLabsSynthesizerConstructor } from './ElevenLabsSynthesizer';

export function createElevenLabsSynthesizer(props: ElevenLabsSynthesizerConstructor) {
  return new ElevenLabsSynthesizer(props);
}
