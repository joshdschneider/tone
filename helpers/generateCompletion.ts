import { ParsedEvent, ReconnectInterval, createParser } from 'eventsource-parser';
import { OpenAIFunction, OpenAIMessage } from '../types';

const API_KEY = process.env.OPENAI_API_KEY as string;
const BASE_URL = 'https://api.openai.com/v1';
const URL = `${BASE_URL}/chat/completions`;
const DEFAULT_MODEL = 'gpt-3.5-turbo-0613';
const DEFAULT_TEMPERATURE = 0.5;

type GenerateCompletionRequest = {
  messages: OpenAIMessage[];
  functions?: OpenAIFunction[];
  signal: AbortSignal;
};

export async function generateCompletion({
  messages,
  functions,
  signal,
}: GenerateCompletionRequest) {
  const res = await fetch(URL, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      messages,
      functions,
      stream: true,
    }),
    signal,
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new Error(`OpenAI error: ${result.error.toString()}`);
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
