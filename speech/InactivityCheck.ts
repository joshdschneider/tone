import { Split } from '../generator/Generator';
import { CallEvent, VoiceOptions } from '../types';
import { INACTIVITY_FIRST_CHECK, INACTIVITY_SECOND_CHECK } from '../utils/constants';
import { log } from '../utils/log';
import { Speech, SpeechConstructor } from './Speech';

export type InactivityCheckConstructor = {
  event: CallEvent;
  language?: string;
} & SpeechConstructor;

export class InactivityCheck extends Speech {
  private voiceOptions?: VoiceOptions;

  constructor({ event, language, voiceOptions, voiceProvider }: InactivityCheckConstructor) {
    super({ voiceOptions, voiceProvider });
    this.voiceOptions = voiceOptions;

    if (event === CallEvent.INACTIVITY_FIRST) {
      this.firstCheck();
    } else if (event === CallEvent.INACTIVITY_SECOND) {
      this.secondCheck();
    }
  }

  private firstCheck() {
    log(`Synthesizing first check`);
    const chunk = {
      text: INACTIVITY_FIRST_CHECK,
      split: Split.NONE,
      isFinal: true,
    };

    if (this.voiceOptions) {
      this.synthesize(chunk);
    } else {
      this.synthesize(chunk);
    }
  }

  private secondCheck() {
    log(`Synthesizing second check`);
    const chunk = {
      text: INACTIVITY_SECOND_CHECK,
      split: Split.NONE,
      isFinal: true,
    };

    if (this.voiceOptions) {
      this.synthesize(chunk);
    } else {
      this.synthesize(chunk);
    }
  }
}
