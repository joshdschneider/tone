import WebSocket from 'ws';
import { createAgent } from '../agent/createAgent';
import { injectContext } from '../helpers/injectContext';
import { parseContext } from '../helpers/parseContext';
import { parseVariables } from '../helpers/parseVariables';
import { wrapPrompt } from '../helpers/wrapPrompt';
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

  const { direction, context, functions } = config;
  const { id: agentId, prompt_text, variables, call_settings } = config.agent;
  const { greeting, voicemail, voice_provider, voice_options, language, keywords } =
    call_settings!!;

  const transcriber = createTranscriber({
    keywords: keywords || undefined,
    language: language || undefined,
  });

  const parsedVariables = parseVariables(variables);
  const parsedContext = parseContext(context);
  const promptWithContext = injectContext(prompt_text, parsedVariables, parsedContext);
  const prompt = wrapPrompt(promptWithContext);

  console.log(prompt);

  const agent = createAgent({
    id: agentId,
    prompt,
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
