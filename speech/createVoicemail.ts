import { Voicemail, VoicemailConstructor } from './Voicemail';

export function createVoicemail(props: VoicemailConstructor) {
  return new Voicemail(props);
}
