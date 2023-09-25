import WebSocket from 'ws';
import { createAgent } from '../agent/createAgent';
import { captureException } from '../helpers/captureException';
import CallService from '../services/CallService';
import { createSynthesizer } from '../synthesizer/createSynthesizer';
import { createTranscriber } from '../transcriber/createTranscriber';
import { AgentConfiguration, ConnectionEvent } from '../types';
import { DEFAULT_GREETING, DEFAULT_PROMPT } from '../utils/constants';
import { log } from '../utils/log';
import { Call } from './Call';

export type CreateCallProps = {
  socket: WebSocket.WebSocket;
  data: ConnectionEvent;
};

export async function createCall({ socket, data }: CreateCallProps) {
  const { event, ['content-type']: _, id } = data;
  let config: AgentConfiguration;

  try {
    const response = await CallService.startCall(id);
    config = response.callConfiguration;
  } catch (err) {
    captureException(err);
    socket.close();
    return;
  }

  log(`Creating call with config: ${JSON.stringify(config)}`);

  const {
    id: agentId,
    direction,
    prompt,
    greeting,
    voicemail,
    voiceProvider,
    voiceId,
    functions,
    language,
    keywords,
  } = config;

  const transcriber = createTranscriber({
    keywords: keywords ? keywords.split(' ') : undefined,
    language: language || undefined,
  });

  const synthesizer = createSynthesizer({
    provider: voiceProvider,
    voiceId,
    language: language || undefined,
  });

  const agent = createAgent({
    id: agentId,
    prompt: prompt || DEFAULT_PROMPT,
    greeting: greeting || DEFAULT_GREETING,
    voicemail: voicemail || undefined,
    functions: functions || undefined,
  });

  return new Call({
    socket,
    id,
    direction,
    transcriber,
    agent,
    synthesizer,
  });
}
