import WebSocket from 'ws';
import { createAgent } from '../agent/createAgent';
import CallService from '../services/CallService';
import { createTranscriber } from '../transcriber/createTranscriber';
import { CallConfiguration, ConnectionEvent } from '../types';
import { log } from '../utils/log';
import { Call } from './Call';

export type CreateCallProps = {
  socket: WebSocket.WebSocket;
  data: ConnectionEvent;
};

export async function createCall({ socket, data }: CreateCallProps) {
  const { event, ['content-type']: _, id: callId } = data;
  let config: CallConfiguration;

  try {
    const response = await CallService.getCallConfig(callId);
    config = response.config;
  } catch (err) {
    throw err;
  }

  log(`Creating call with config: ${JSON.stringify(config)}`);

  const { direction, functions } = config;
  const { id: agentId, prompt_text, variables, call_settings } = config.agent;
  const { greeting, voicemail, voice_provider, voice_options, language, keywords } =
    call_settings!!;

  const transcriber = createTranscriber({
    keywords: keywords || undefined,
    language: language || undefined,
  });

  const agent = createAgent({
    id: agentId,
    prompt: prompt_text || undefined,
    greeting: greeting || undefined,
    eagerGreet: true,
    voicemail: voicemail || undefined,
    functions: functions.length > 0 ? functions : undefined,
    voiceProvider: voice_provider || undefined,
    voiceOptions: voice_options || undefined,
    language: language || undefined,
  });

  return new Call({
    socket,
    id: callId,
    direction,
    transcriber,
    agent,
  });
}
