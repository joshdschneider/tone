import { Message } from '../types';

const phrases = ['voice mail', 'voicemail', 'voice message', 'automated voice', 'automatic voice'];

export function detectVoicemail(messages: Message[]) {
  if (!messages.length) {
    return false;
  }

  const first = messages[0];
  const content = first.content;
  const normalized = content.toLowerCase().trim();

  for (const phrase of phrases) {
    if (normalized.includes(phrase)) {
      return true;
    }
  }

  return false;
}
