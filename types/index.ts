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

export type AgentConfiguration = {
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

export enum AgentState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING',
}

export enum Event {
  CALL_CONNECTED_INBOUND = 'CALL_CONNECTED_INBOUND',
  CALL_CONNECTED_OUTBOUND = 'CALL_CONNECTED_OUTBOUND',
  TRANSCRIPT_PARTIAL = 'TRANSCRIPT_PARTIAL',
  TRANSCRIPT_FULL = 'TRANSCRIPT_FULL',
  TRANSCRIPT_ENDPOINT = 'TRANSCRIPT_ENDPOINT',
  TRANSCRIBER_ERROR = 'TRANSCRIBER_ERROR',
  TRANSCRIBER_FATAL = 'TRANSCRIBER_FATAL',
  GENERATION_STARTED = 'GENERATION_STARTED',
  GENERATION_ENDED = 'GENERATION_ENDED',
  GENERATION_ERROR = 'GENERATION_ERROR',
  GENERATION_FATAL = 'GENERATION_FATAL',
  SYNTHESIS_STARTED = 'SYNTHESIS_STARTED',
  SYNTHESIS_ENDED = 'SYNTHESIS_ENDED',
  SYNTHESIS_ERROR = 'SYNTHESIS_ERROR',
  SYNTHESIS_FATAL = 'SYNTHESIS_FATAL',
}

export type QueueEvent = {
  event: Event;
  payload?: any;
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

export type Fn = OpenAIFunction & {
  actionId: string;
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

export enum GenerationType {
  GREETING = 'GREETING',
  RECOVERY = 'RECOVERY',
  RESPONSE = 'RESPONSE',
}
