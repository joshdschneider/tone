import WebSocket from 'ws';
import { createAgent } from '../agent/createAgent';
import { getActionFunctions } from '../helpers/getActionFunctions';
import { getGreeting } from '../helpers/getGreeting';
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

  const response = await CallService.getCallConfig(callId);
  config = response.config;
  log(`Creating call with config: ${JSON.stringify(config)}`);

  const { direction, context, functions } = config;
  const { id: agentId, prompt_text, variables, call_settings, language } = config.agent;

  if (!call_settings) {
    throw new Error('Call settings not found');
  }

  const { voicemail_enabled, voicemail_message, voice_provider, voice_options, keywords } =
    call_settings;

  const greeting = getGreeting(direction, call_settings);
  const voicemail = voicemail_enabled && voicemail_message ? voicemail_message : undefined;

  const transcriber = createTranscriber({
    keywords: keywords || undefined,
    language: language || undefined,
  });

  const parsedVariables = parseVariables(variables);
  const parsedContext = parseContext(context);
  const promptWithContext = injectContext(prompt_text, parsedVariables, parsedContext);
  const prompt = wrapPrompt(promptWithContext);
  const actionFunctions = getActionFunctions(functions);

  const agent = createAgent({
    id: agentId,
    callId,
    prompt,
    greeting,
    eagerGreet: true,
    voicemail,
    functions: actionFunctions,
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
