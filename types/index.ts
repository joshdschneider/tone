export enum CallDirection {
  OUTBOUND = 'OUTBOUND',
  INBOUND = 'INBOUND',
}

export enum VoiceProvider {
  ELEVENLABS = 'ELEVENLABS',
}

export type Transcript = {
  speech: string;
  start: number;
  end: number;
  isFinal: boolean;
  isEndpoint: boolean;
};

export type ConnectionEvent = {
  event: string;
  'content-type': string;
  id: string;
};

export type DefaultError = {
  success: false;
  error: string;
};

export type CallConfiguration = {
  id: string;
  direction: CallDirection;
  prompt: string | null;
  greeting: string | null;
  voicemail: string | null;
  voiceProvider: VoiceProvider;
  voiceId: string;
  functions: string | null;
  language: string | null;
  keywords: string | null;
};
