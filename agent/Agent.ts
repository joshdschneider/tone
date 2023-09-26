import { EventEmitter } from 'stream';
import { captureException } from '../helpers/captureException';
import { getOpenAICompletion } from '../helpers/getOpenAICompletion';
import { AgentState, GenerationType, Message, OpenAIMessage, Role } from '../types';
import { RECOVERY_MESSAGE } from '../utils/constants';
import { log } from '../utils/log';

export type AgentConstructor = {
  id: string;
  prompt: string;
  greeting: string;
  voicemail?: string;
  functions?: string;
};

export class Agent extends EventEmitter {
  public state: AgentState;
  private id: string;
  private prompt: string;
  public greeting: string;
  private voicemail?: string;
  private functions?: string;
  private controller: AbortController;
  private errorCount: number;
  private maxErrors: number;

  constructor({ id, prompt, greeting, voicemail, functions }: AgentConstructor) {
    super();
    this.state = AgentState.IDLE;
    this.id = id;
    this.prompt = prompt;
    this.greeting = greeting;
    this.voicemail = voicemail;
    this.functions = functions;
    this.controller = new AbortController();
    this.errorCount = 0;
    this.maxErrors = 3;
  }

  public setState(state: AgentState): void {
    if (this.state !== state) {
      log(`Updating state: ${this.state} => ${state}`);
      this.state = state;
    }
  }

  public generate(messages: Message[], type?: GenerationType) {
    switch (type) {
      case GenerationType.GREETING:
        this.emit('text', this.greeting);
        return;
      case GenerationType.RECOVERY:
        this.emit('text', RECOVERY_MESSAGE);
        return;
      default:
        getOpenAICompletion({
          messages: this.formatMessages(messages),
          // functions: this.formatFunctions(this.functions),
          signal: this.controller.signal,
        })
          .then((stream) =>
            this.handleStream(stream)
              .then(() => null)
              .catch((err) => this.handleError(err))
          )
          .catch((err) => this.handleError(err));
    }
  }

  private async handleStream(stream: ReadableStream) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let done = false;
    let chunks = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      chunks += chunkValue;
    }
  }

  private formatMessages(messages: Message[]): OpenAIMessage[] {
    const formatted: OpenAIMessage[] = messages.map((message) => {
      const { start, end, ...rest } = message;
      return { ...rest };
    });

    formatted.unshift({ role: Role.SYSTEM, content: this.prompt });
    return formatted;
  }

  private handleError(err: any) {
    captureException(err);
    this.errorCount++;
    if (this.errorCount >= this.maxErrors) {
      this.emit('fatal');
    } else {
      this.emit('error', err);
    }
  }

  public cancel() {
    // TODO
  }

  public destroy() {
    // TODO
  }
}
