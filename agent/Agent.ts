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
  SpeechChunk,
  VoiceOptions,
  VoiceProvider,
} from '../types';
import { MESSAGE_TIMESTAMP_DELTA } from '../utils/constants';
import { log } from '../utils/log';

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
  }

  private respond() {
    log('Creating response');
    this.speech = createResponse({
      messages: this.messages,
      voiceProvider: this.voiceProvider,
      voiceOptions: this.voiceOptions,
    });

    this.speech.on('chunk', (chunk) => this.handleSpeechChunk(chunk));
  }

  private handleSpeechChunk(chunk: SpeechChunk) {
    log(JSON.stringify(chunk));
  }

  private abort() {
    if (this.speech) {
      log('Aborting speech');
      this.speech.destroy();
      this.speech.removeAllListeners();
      this.speech = undefined;
    }
  }

  public destroy() {
    log(`Destroying agent`);
    this.abort();
    this.removeAllListeners();
  }
}
