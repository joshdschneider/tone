import WebSocket from 'ws';
import { createAgent } from '../agent/createAgent';
import { captureException } from '../helpers/captureException';
import CallService from '../services/CallService';
import { createSynthesizer } from '../synthesizer/createSynthesizer';
import { createTranscriber } from '../transcriber/createTranscriber';
import { CallConfiguration, ConnectionEvent } from '../types';
import { DEFAULT_GREETING, DEFAULT_PROMPT } from '../utils/constants';
import { Call } from './Call';

export type CreateCallProps = {
  socket: WebSocket.WebSocket;
  data: ConnectionEvent;
};

export async function createCall({ socket, data }: CreateCallProps) {
  const { event, ['content-type']: _, id: callId } = data;
  let config: CallConfiguration;

  try {
    const response = await CallService.startCall(callId);
    config = response.callConfiguration;
  } catch (err) {
    captureException(err);
    socket.close();
    return;
  }

  const {
    id,
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
    prompt: prompt || DEFAULT_PROMPT,
    greeting: greeting || DEFAULT_GREETING,
    voicemail: voicemail || undefined,
    functions: functions || undefined,
    synthesizer,
  });

  return new Call({
    socket,
    id: callId,
    direction,
    transcriber,
    agent,
  });
}
