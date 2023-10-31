import { CallConfiguration, Message } from '../types';
import { TONE_API_URL, TONE_INTERNAL_API_KEY } from '../utils/constants';

const BASE_URL = `${TONE_API_URL}/internal/calls`;

type GetCallConfigResponse = {
  success: boolean;
  config: CallConfiguration;
};

async function getCallConfig(callId: string): Promise<GetCallConfigResponse> {
  const response = await fetch(`${BASE_URL}/${callId}/config`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${TONE_INTERNAL_API_KEY}` },
  });

  const data = await response.json();
  return data;
}

type EndCallPayload = {
  start: number;
  end: number;
  messages: Message[];
  missed: boolean;
};

type EndCallResponse = {
  success: true;
  callId: string;
};

async function saveCall(callId: string, payload: EndCallPayload): Promise<EndCallResponse> {
  const response = await fetch(`${BASE_URL}/${callId}/save`, {
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

export default { getCallConfig, saveCall };
