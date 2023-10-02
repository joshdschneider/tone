import nlp from 'compromise';
import { EventEmitter } from 'events';
import { captureException } from '../helpers/captureException';
import { generateCompletion } from '../helpers/generateCompletion';
import { ActionFunction, Message, OpenAIFunction, OpenAIMessage, Role } from '../types';
import { DEFAULT_PROMPT } from '../utils/constants';
import { LogLevel, log } from '../utils/log';

export type GeneratorConstructor = {
  messages: Message[];
  prompt?: string;
  functions?: ActionFunction[];
  split?: Split;
};

export class Generator extends EventEmitter {
  private messages: Message[];
  private prompt?: string;
  private functions?: ActionFunction[];
  private split: Split;
  private controller?: AbortController;

  constructor({ messages, prompt, functions, split }: GeneratorConstructor) {
    super();
    this.messages = messages;
    this.prompt = prompt;
    this.functions = functions;
    this.split = split || Split.WORD;
  }

  private formatMessages(messages: Message[]): OpenAIMessage[] {
    const formatted: OpenAIMessage[] = messages.map((message) => {
      const { start, end, ...rest } = message;
      return { ...rest };
    });

    formatted.unshift({
      role: Role.SYSTEM,
      content: this.prompt || DEFAULT_PROMPT,
    });

    return formatted;
  }

  private formatFunctions(functions?: ActionFunction[]): OpenAIFunction[] | undefined {
    return functions
      ? functions.map((func) => {
          const { action_id, ...rest } = func;
          return { ...rest };
        })
      : undefined;
  }

  public generate() {
    log('Generating response');
    this.controller = new AbortController();
    generateCompletion({
      messages: this.formatMessages(this.messages),
      functions: this.formatFunctions(this.functions),
      signal: this.controller.signal,
    })
      .then(this.handleStream.bind(this))
      .then(() => {
        log('Generation done');
        this.controller = undefined;
        this.emit('done');
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          log('Generate response aborted');
        } else {
          log('Generator error', LogLevel.ERROR);
          captureException(err);
          this.emit('error', err);
        }
      });
  }

  private async handleStream(stream: ReadableStream): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let done = false;
    let chunks = '';
    let name = '';
    let args = '';

    let firstChunkParsed = false;
    let responseType = ResponseType.TEXT;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunk = decoder.decode(value);
      const response = this.parseChunk(chunk);
      if (!response) {
        continue;
      }

      if (!firstChunkParsed) {
        responseType = response.type;
        firstChunkParsed = true;
      }

      if (response.type === ResponseType.FUNCTION_CALL) {
        if (response.functionCall.name) {
          name = response.functionCall.name;
        }
        if (response.functionCall.arguments) {
          args += response.functionCall.arguments;
        }
      } else {
        chunks += response.text;
        if (this.split === Split.WORD) {
          if (chunks.includes(' ')) {
            const words = chunks.split(' ');
            const word = words.shift();
            if (word) {
              const rest = words.join(' ');
              chunks = rest;
              this.emit('text', {
                text: word + ' ',
                split: this.split,
                isFinal: false,
              });
            }
          }
        } else if (this.split === Split.SENTENCE) {
          const doc = nlp(chunks);
          const sentences = doc.sentences().out('array');
          if (sentences.length > 1) {
            const sentence = sentences.shift();
            const rest = sentences.join(' ');
            chunks = rest;
            this.emit('text', {
              text: sentence + ' ',
              split: this.split,
              isFinal: false,
            });
          }
        }
      }
    }

    if (responseType === ResponseType.FUNCTION_CALL) {
      const parsedArgs = JSON.parse(args);
      this.emit('functionCall', {
        name,
        args: parsedArgs,
      });
    } else {
      this.emit('text', {
        text: chunks,
        split: this.split,
        isFinal: true,
      });
    }
  }

  private parseChunk(chunk: string): ParseChunkResponse | null {
    let choice;
    try {
      const obj = JSON.parse(chunk);
      choice = obj.choices[0].delta;
    } catch (_) {
      return null;
    }

    if (choice.function_call) {
      return {
        type: ResponseType.FUNCTION_CALL,
        functionCall: {
          name: choice.function_call.name || undefined,
          arguments: choice.function_call.arguments || undefined,
        },
      };
    } else if (choice.content) {
      return {
        type: ResponseType.TEXT,
        text: choice.content,
      };
    } else {
      return null;
    }
  }

  public destroy(): void {
    log(`Destroying generator`);
    if (this.controller) {
      this.controller.abort();
      this.controller = undefined;
    }

    this.removeAllListeners();
  }
}

export enum Split {
  WORD = 'WORD',
  SENTENCE = 'SENTENCE',
  NONE = 'NONE',
}

enum ResponseType {
  TEXT = 'TEXT',
  FUNCTION_CALL = 'FUNCTION_CALL',
}

type FunctionCallResponse = {
  type: ResponseType.FUNCTION_CALL;
  functionCall: {
    name?: string;
    arguments?: string;
  };
};

type TextResponse = {
  type: ResponseType.TEXT;
  text: string;
};

type ParseChunkResponse = FunctionCallResponse | TextResponse;
