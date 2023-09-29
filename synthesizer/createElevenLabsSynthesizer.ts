import { ElevenLabsOptions } from '../types';
import { ElevenLabsSynthesizer } from './ElevenLabsSynthesizer';

export function createElevenLabsSynthesizer(options: ElevenLabsOptions) {
  return new ElevenLabsSynthesizer(options);
}
