import { Split } from '../generator/Generator';

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
  context: string | null;
  functions: ActionFunction[];
};

export type Transcript = {
  speech: string;
  start: number;
  end: number;
  isFull: boolean;
  isFinal: boolean;
  confidenceScore: number;
};

export type TextChunk = {
  text: string;
  split: Split;
  isFinal: boolean;
};

export type SynthesisChunk = {
  audio: Buffer;
  text?: string;
};

export type SpeechChunk = {
  start: number;
  end: number;
} & SynthesisChunk;

export type CacheOptions = {
  key: string;
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
  prompt_raw: string | null;
  prompt_text: string | null;
  variables: string | null;
  calls_enabled: boolean;
  call_settings: CallSettings | null;
  texts_enabled: boolean;
  text_settings: TextSettings | null;
  created_at: Date;
  updated_at: Date;
  deleted_At: Date | null;
};

export type CallSettings = {
  inbound_enabled: boolean;
  outbound_enabled: boolean;
  greeting: string | null;
  voicemail: string | null;
  language: string | null;
  keywords: string | null;
  voice_provider: VoiceProvider;
  voice_options: VoiceOptions;
};

export type TextSettings = {};

export type Variable = {
  id: string;
  name: string;
  fallback: string | null;
  required: boolean;
  source: VariableSource | null;
};

export type VariableSource = {};

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
  TRANSCRIPT_FINAL = 'TRANSCRIPT_FINAL',
  SPEECH_ENDED = 'SPEECH_ENDED',
  SPEECH_ERROR = 'SPEECH_ERROR',
  INACTIVITY_FIRST = 'INACTIVITY_FIRST',
  INACTIVITY_SECOND = 'INACTIVITY_SECOND',
  INACTIVITY_THIRD = 'INACTIVITY_THIRD',
}

export type FunctionCall = {
  name: string;
  args: any;
};

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
  hoist_final_response?: boolean;
  require_human_approval?: boolean;
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
