import { Split } from '../generator/Generator';
import { log } from '../utils/log';
import { Speech, SpeechConstructor } from './Speech';

export type VoicemailConstructor = {
  voicemail: string;
} & SpeechConstructor;

export class Voicemail extends Speech {
  private voicemail: string;

  constructor({ voicemail, voiceOptions, voiceProvider, language }: VoicemailConstructor) {
    super({ voiceOptions, voiceProvider, language });
    this.voicemail = voicemail;
    this.leaveVoicemail();
    this.endCallOnDone = true;
  }

  private leaveVoicemail() {
    log(`Leaving voicemail`);
    const chunk = {
      text: this.voicemail,
      split: Split.NONE,
      isFinal: true,
    };

    this.synthesize(chunk);
  }
}
