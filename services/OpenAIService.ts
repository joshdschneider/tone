import { ParsedEvent, ReconnectInterval, createParser } from 'eventsource-parser';
import { captureException } from '../helpers/captureException';
import { OpenAIFunction, OpenAIMessage, Role } from '../types';
import { DEFAULT_ERROR_MESSAGE } from '../utils/constants';
import { LogLevel, log } from '../utils/log';

const API_KEY = process.env.OPENAI_API_KEY as string;
const BASE_URL = 'https://api.openai.com/v1';
const URL = `${BASE_URL}/chat/completions`;
const GPT_TURBO = 'gpt-3.5-turbo';
const GPT_TURBO_16K = 'gpt-3.5-turbo-16k';
const DEFAULT_TEMPERATURE = 0.5;

type GenerateCompletionRequest = {
  messages: OpenAIMessage[];
  functions?: OpenAIFunction[];
  temperature?: number;
  signal: AbortSignal;
};

async function generateCompletion({
  messages,
  functions,
  temperature,
  signal,
}: GenerateCompletionRequest) {
  const res = await fetch(URL, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: fetchModel(messages),
      temperature: temperature || DEFAULT_TEMPERATURE,
      messages,
      functions,
      function_call: 'auto',
      stream: true,
    }),
    signal,
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new Error(`OpenAI error: ${JSON.stringify(result.error)}`);
    } else {
      throw new Error(`OpenAI error`);
    }
  }

  const readableStream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          if ('data' in event && event.data === '[DONE]') {
            controller.close();
            return;
          }

          if ('data' in event) {
            const data = event.data;
            const queue = encoder.encode(data);
            controller.enqueue(queue);
          }
        }
      };

      const parser = createParser(onParse);
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return readableStream;
}

function fetchModel(messages: OpenAIMessage[]) {
  try {
    if (messages.length > 0) {
      const role = messages[0].role;
      if (role === Role.SYSTEM) {
        const promptText = messages[0].content;
        const upperLimit = 12000;
        if (promptText.length > upperLimit) {
          return GPT_TURBO_16K;
        } else {
          return GPT_TURBO;
        }
      }
    }
    throw new Error(DEFAULT_ERROR_MESSAGE);
  } catch (err) {
    log('OpenAIService error', LogLevel.ERROR);
    captureException(err);
    return GPT_TURBO;
  }
}

export default { generateCompletion };
