import { EventEmitter } from 'events';
import { captureException } from '../helpers/captureException';
import { Speech } from '../speech/Speech';
import { createGreeting } from '../speech/createGreeting';
import { createResponse } from '../speech/createResponse';
import { StateMachine } from '../stateMachine/StateMachine';
import { createStateMachine } from '../stateMachine/createStateMachine';
import {
  ActionFunction,
  AgentState,
  CallEvent,
  Message,
  Role,
  SpeechChunk,
  VoiceOptions,
  VoiceProvider,
} from '../types';
import { MESSAGE_TIMESTAMP_DELTA } from '../utils/constants';
import { LogLevel, log } from '../utils/log';

export type AgentConstructor = {
  id: string;
  prompt?: string;
  greeting?: string;
  voicemail?: string;
  functions?: ActionFunction[];
  voiceProvider?: VoiceProvider;
  voiceOptions?: VoiceOptions;
};

export class Agent extends EventEmitter {
  public state: AgentState;
  private id: string;
  private prompt?: string;
  private greeting?: string;
  private voicemail?: string;
  private functions?: ActionFunction[];
  private voiceProvider?: VoiceProvider;
  private voiceOptions?: VoiceOptions;
  public messages: Message[];
  private queue: CallEvent[];
  private isProcessing: boolean;
  private machine: StateMachine;
  private speech?: Speech;

  constructor({
    id,
    prompt,
    greeting,
    voicemail,
    functions,
    voiceProvider,
    voiceOptions,
  }: AgentConstructor) {
    super();
    this.state = AgentState.IDLE;
    this.id = id;
    this.prompt = prompt;
    this.greeting = greeting;
    this.voicemail = voicemail;
    this.functions = functions;
    this.voiceProvider = voiceProvider;
    this.voiceOptions = voiceOptions;
    this.messages = [];
    this.queue = [];
    this.isProcessing = false;
    this.machine = createStateMachine({
      setState: (state: AgentState) => this.setState(state),
      hasGreeting: !!this.greeting,
      greet: () => this.greet(),
      respond: () => this.respond(),
      abort: () => this.abort(),
    });
  }

  public enqueue(event: CallEvent) {
    log(`Enqueueing event: ${event}`);
    this.queue.push(event);
    if (!this.isProcessing) {
      this.dequeue();
    }
  }

  private dequeue() {
    log(`Dequeueing event`);
    if (this.queue.length === 0) {
      log(`Stopping queue`);
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const event = this.queue.shift();
    if (event) {
      this.process(event);
      this.dequeue();
    }
  }

  private process(event: CallEvent) {
    try {
      log(`Processing event: ${event}`);
      this.machine.transition(this.state, event);
    } catch (err: any) {
      captureException(err);
    }
  }

  private setState(state: AgentState): void {
    if (this.state !== state) {
      log(`Updating state: ${this.state} => ${state}`);
      this.state = state;
    }
  }

  public appendMessage(message: Message) {
    if (this.messages.length === 0) {
      log(`Appending message: ${JSON.stringify(message)}`);
      this.messages.push(message);
      return;
    }

    const prev = this.messages[this.messages.length - 1];
    const sameRole = message.role === prev.role;
    if (sameRole) {
      const delta = MESSAGE_TIMESTAMP_DELTA;
      const sameUtterance = !prev.end || message.start - prev.end <= delta;
      if (sameUtterance) {
        log(`Appending partial message: ${message.content}`);
        prev.content += ` ${message.content}`;
        prev.end = message.end;
        return;
      }
    }

    log(`Appending message: ${JSON.stringify(message)}`);
    this.messages.push(message);
  }

  private greet() {
    log('Creating greeting');
    this.speech = createGreeting({
      greeting: this.greeting,
      agentId: this.id,
      voiceProvider: this.voiceProvider,
      voiceOptions: this.voiceOptions,
    });

    this.speech.on('chunk', (chunk) => this.handleSpeechChunk(chunk));
    this.speech.on('done', () => this.handleSpeechDone());
    this.speech.on('error', (err) => this.handleSpeechError(err));
  }

  private respond() {
    log('Creating response');
    this.speech = createResponse({
      messages: this.messages,
      prompt: this.prompt,
      functions: this.functions,
      voiceProvider: this.voiceProvider,
      voiceOptions: this.voiceOptions,
    });

    this.speech.on('chunk', (chunk) => this.handleSpeechChunk(chunk));
    this.speech.on('done', () => this.handleSpeechDone());
    this.speech.on('error', (err) => this.handleSpeechError(err));
  }

  private handleSpeechChunk(chunk: SpeechChunk) {
    if (this.state === AgentState.SPEAKING) {
      log('Speech chunk received');
      if (chunk.text) {
        this.appendMessage({
          role: Role.ASSISTANT,
          content: chunk.text,
          start: chunk.start,
          end: chunk.end,
        });
      }
      this.emit('speech', chunk.audio);
    } else {
      log(`Speech chunk received in state ${this.state}`, LogLevel.WARN);
    }
  }

  private handleSpeechDone() {
    log('Enqueueing speech ended');
    this.enqueue(CallEvent.SPEECH_ENDED);
  }

  private handleSpeechError(err: any) {
    log('Enqueueing speech error');
    this.enqueue(CallEvent.SPEECH_ERROR);
  }

  private abort() {
    if (this.speech) {
      log('Aborting speech');
      this.speech.destroy();
      this.speech = undefined;
    }
  }

  public destroy() {
    log(`Destroying agent`);
    this.abort();
    this.queue.length = 0;
    this.isProcessing = false;
    this.removeAllListeners();
  }
}
