import { AgentConfiguration } from '../types';
import { TONE_API_URL, TONE_INTERNAL_API_KEY } from '../utils/constants';

const BASE_URL = `${TONE_API_URL}/internal/calls`;

type StartCallResponse = {
  agentConfiguration: AgentConfiguration;
};

async function startCall(callId: string): Promise<StartCallResponse> {
  const response = await fetch(`${BASE_URL}/${callId}/start`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${TONE_INTERNAL_API_KEY}` },
  });

  const data = await response.json();
  return data;
}

type EndCallPayload = {
  // TODO
};

type EndCallResponse = {
  success: true;
  callId: string;
};

async function endCall(callId: string, payload: EndCallPayload): Promise<EndCallResponse> {
  const response = await fetch(`${BASE_URL}/${callId}/end`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TONE_INTERNAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data;
}

export default { startCall, endCall };
