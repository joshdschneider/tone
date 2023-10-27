import { Split } from '../generator/Generator';
import { VoiceOptions } from '../types';
import { DEFAULT_RECOVERY } from '../utils/constants';
import { log } from '../utils/log';
import { Speech, SpeechConstructor } from './Speech';

export type RecoveryConstructor = {
  language?: string;
} & SpeechConstructor;

export class Recovery extends Speech {
  private voiceOptions?: VoiceOptions;

  constructor({ language, voiceOptions, voiceProvider }: RecoveryConstructor) {
    super({ voiceOptions, voiceProvider });
    this.voiceOptions = voiceOptions;
    this.recover();
  }

  private recover() {
    log(`Synthesizing recovery`);
    const chunk = {
      text: DEFAULT_RECOVERY,
      split: Split.NONE,
      isFinal: true,
    };

    this.synthesize(chunk);
  }
}
