export enum CallDirection {
  OUTBOUND = 'OUTBOUND',
  INBOUND = 'INBOUND',
}

export enum VoiceProvider {
  ELEVENLABS = 'ELEVENLABS',
}

export type CallConfiguration = {
  direction: CallDirection;
  agent: Agent;
  functions: ActionFunction[];
};

export type Transcript = {
  speech: string;
  start: number;
  end: number;
  isFinal: boolean;
  isEndpoint: boolean;
};

export type SpeechChunk = {
  audio: Buffer;
  text?: string;
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

export type Agent = {
  id: string;
  organization_id: string;
  number_id: string | null;
  name: string;
  active: boolean;
  inbound_enabled: boolean;
  outbound_enabled: boolean;
  prompt: string | null;
  greeting: string | null;
  voicemail: string | null;
  language: string | null;
  keywords: string | null;
  voice_provider: VoiceProvider;
  voice_options: VoiceOptions;
  created_at: Date;
  updated_at: Date;
  deleted_At: Date | null;
};

export type ElevenLabsOptions = {
  id: string;
  name: string;
  stability?: number;
  similarity_boost?: number;
};

export type VoiceOptions = ElevenLabsOptions; // Mutex based on provider

export enum AgentState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  SPEAKING = 'SPEAKING',
}

export enum CallEvent {
  CALL_CONNECTED_INBOUND = 'CALL_CONNECTED_INBOUND',
  CALL_CONNECTED_OUTBOUND = 'CALL_CONNECTED_OUTBOUND',
  TRANSCRIPT_PARTIAL = 'TRANSCRIPT_PARTIAL',
  TRANSCRIPT_FULL = 'TRANSCRIPT_FULL',
  TRANSCRIPT_ENDPOINT = 'TRANSCRIPT_ENDPOINT',
  GREETING_ENDED = 'GREETING_ENDED',
  RESPONSE_ENDED = 'RESPONSE_ENDED',
}

export interface OpenAIBaseMessage {
  role: Role;
  content: string | null | any;
}

export enum Role {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function',
}

export interface OpenAIFunction {
  name: string;
  description?: string;
  parameters: {
    type: 'object';
    properties: {
      [key: string]: any;
    };
    required?: string[];
  };
}

export type ActionFunction = OpenAIFunction & {
  action_id: string;
};

export interface ContentMessage extends OpenAIBaseMessage {
  role: Role.SYSTEM | Role.USER | Role.ASSISTANT;
  content: string;
}

export interface AssistantFunctionCall extends OpenAIBaseMessage {
  role: Role.ASSISTANT;
  content: null;
  function_call: {
    name: string;
    arguments: any;
  };
}

export interface FunctionResponse extends OpenAIBaseMessage {
  role: Role.FUNCTION;
  name: string;
  content: any;
}

export type OpenAIMessage = ContentMessage | AssistantFunctionCall | FunctionResponse;

export type Message = {
  start: number;
  end?: number;
} & OpenAIMessage;
