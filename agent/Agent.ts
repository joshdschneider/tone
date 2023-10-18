import { EventEmitter } from 'events';
import { captureException } from '../helpers/captureException';
import ActionService from '../services/ActionService';
import { Speech } from '../speech/Speech';
import { createGreeting } from '../speech/createGreeting';
import { createInactivityCheck } from '../speech/createInactivityCheck';
import { createRecovery } from '../speech/createRecovery';
import { createResponse } from '../speech/createResponse';
import { StateMachine } from '../stateMachine/StateMachine';
import { createStateMachine } from '../stateMachine/createStateMachine';
import {
  ActionFunction,
  AgentState,
  CallEvent,
  FunctionCall,
  Message,
  Role,
  VoiceOptions,
  VoiceProvider,
} from '../types';
import { MESSAGE_TIMESTAMP_DELTA } from '../utils/constants';
import { getHoistedGreetingContent } from '../utils/greeting';
import { LogLevel, log } from '../utils/log';
import { now } from '../utils/now';

export type AgentConstructor = {
  id: string;
  prompt?: string;
  greeting?: string;
  eagerGreet?: boolean;
  voicemail?: string;
  functions?: ActionFunction[];
  voiceProvider?: VoiceProvider;
  voiceOptions?: VoiceOptions;
  language?: string;
};

export class Agent extends EventEmitter {
  public state: AgentState;
  private id: string;
  private prompt?: string;
  private greeting?: string;
  private eagerGreet?: boolean;
  private voicemail?: string;
  private functions?: ActionFunction[];
  private voiceProvider?: VoiceProvider;
  private voiceOptions?: VoiceOptions;
  private language?: string;
  public messages: Message[];
  private queue: CallEvent[];
  private machine: StateMachine;
  private speech?: Speech;
  private isProcessing: boolean;
  private isHolding: boolean;
  private holdEventCount: number;
  private recoveryCount: number;
  private inactivityCount: number;
  private inactivityTimeout?: NodeJS.Timeout;
  private endCallOnSpeechDone: boolean;

  constructor({
    id,
    prompt,
    greeting,
    eagerGreet,
    voicemail,
    functions,
    voiceProvider,
    voiceOptions,
    language,
  }: AgentConstructor) {
    super();
    this.state = AgentState.IDLE;
    this.id = id;
    this.prompt = prompt;
    this.greeting = greeting;
    this.eagerGreet = eagerGreet;
    this.voicemail = voicemail;
    this.functions = functions;
    this.voiceProvider = voiceProvider;
    this.voiceOptions = voiceOptions;
    this.language = language;
    this.messages = [];
    this.queue = [];
    this.isProcessing = false;
    this.isHolding = false;
    this.holdEventCount = 0;
    this.inactivityCount = 0;
    this.recoveryCount = 0;
    this.endCallOnSpeechDone = false;

    this.machine = createStateMachine({
      setState: (state: AgentState) => this.setState(state),
      hasGreeting: !!this.greeting,
      eagerGreet: !!this.eagerGreet,
      greet: () => this.greet(),
      respond: () => this.respond(),
      pregenerate: () => this.pregenerate(),
      cleanup: () => this.cleanup(),
      abort: () => this.abort(),
      recover: () => this.recover(),
      check: (ev: CallEvent) => this.check(ev),
    });
  }

  private setState(state: AgentState): void {
    if (this.state !== state) {
      log(`Updating state: ${this.state} => ${state}`);
      this.state = state;
    }
  }

  public enqueue(event: CallEvent) {
    log(`Enqueueing event: ${event}`);
    this.queue.push(event);

    if (!this.isHolding) {
      this.monitorInactivity(event);
    } else {
      this.holdEventCount++;
      if (this.holdEventCount > 5) {
        this.isHolding = false;
        this.holdEventCount = 0;
      }
    }

    if (!this.isProcessing) {
      this.dequeue();
    }
  }

  private dequeue() {
    if (this.queue.length === 0) {
      log(`Stopping queue`);
      this.isProcessing = false;
      return;
    }

    log(`Dequeueing event`);
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
    if (this.speech && this.speech.pregenerated) {
      log(`Using pregenerated speech`);
      this.speech.dequeuePregenerated();
      this.stripHoistedGreeting();
      return;
    }

    log('Creating greeting');
    this.speech = createGreeting({
      greeting: this.greeting,
      agentId: this.id,
      voiceProvider: this.voiceProvider,
      voiceOptions: this.voiceOptions,
      language: this.language,
    });

    this.speech.on('speech', (speech: Buffer) => this.handleSpeech(speech));
    this.speech.on('message', (message: Message) => this.handleSpeechMessage(message));
    this.speech.on('done', () => this.handleSpeechDone());
    this.speech.on('error', (err: any) => this.handleSpeechError(err));
  }

  private respond() {
    log('Creating response');
    this.speech = createResponse({
      messages: this.messages,
      prompt: this.prompt,
      functions: this.functions,
      voiceProvider: this.voiceProvider,
      voiceOptions: this.voiceOptions,
      language: this.language,
    });

    this.speech.on('speech', (speech: Buffer) => this.handleSpeech(speech));
    this.speech.on('message', (message: Message) => this.handleSpeechMessage(message));
    this.speech.on('function_call', (func: FunctionCall) => this.handleFunctionCall(func));
    this.speech.on('done', () => this.handleSpeechDone());
    this.speech.on('error', (err: any) => this.handleSpeechError(err));
  }

  private pregenerate() {
    log('Creating pregenerated greeting');
    this.hoistGreeting();

    this.speech = createResponse({
      messages: this.messages,
      prompt: this.prompt,
      functions: this.functions,
      voiceProvider: this.voiceProvider,
      voiceOptions: this.voiceOptions,
      language: this.language,
      pregenerated: true,
    });

    this.speech.on('speech', (speech: Buffer) => this.handleSpeech(speech));
    this.speech.on('message', (message: Message) => this.handleSpeechMessage(message));
    this.speech.on('done', () => this.handleSpeechDone());
    this.speech.on('error', (err: any) => this.handleSpeechError(err));
  }

  private recover() {
    if (this.recoveryCount > 0) {
      log('Fatal error');
      this.emit('end');
      return;
    }

    log('Attempting recovery');
    this.speech = createRecovery({
      language: this.language,
      voiceOptions: this.voiceOptions,
      voiceProvider: this.voiceProvider,
    });

    this.speech.on('speech', (speech: Buffer) => this.handleSpeech(speech));
    this.speech.on('message', (message: Message) => this.handleSpeechMessage(message));
    this.speech.on('done', () => this.handleSpeechDone());
    this.speech.on('end', () => this.handleEndCall());
    this.speech.on('hold', () => this.handleHoldCall());
    this.speech.on('error', (err: any) => this.handleSpeechError(err));
    this.recoveryCount++;
  }

  private check(ev: CallEvent) {
    if (ev === CallEvent.INACTIVITY_THIRD) {
      this.emit('end');
      return;
    }

    log('Checking for inactivity');
    this.speech = createInactivityCheck({
      language: this.language,
      voiceOptions: this.voiceOptions,
      voiceProvider: this.voiceProvider,
      event: ev,
    });

    this.speech.on('speech', (speech: Buffer) => this.handleSpeech(speech));
    this.speech.on('message', (message: Message) => this.handleSpeechMessage(message));
    this.speech.on('done', () => this.handleSpeechDone());
    this.speech.on('error', (err: any) => this.handleSpeechError(err));
  }

  private handleSpeech(speech: Buffer) {
    this.emit('speech', speech);
  }

  private handleSpeechMessage(message: Message) {
    log(`Handling speech message: ${JSON.stringify(message)}`);
    this.appendMessage(message);
  }

  private handleFunctionCall(func: FunctionCall) {
    log('Handling function call');
    this.abort();
    const actionFunction = this.functions?.find((f) => f.name === func.name);
    if (actionFunction) {
      this.executeFunction(actionFunction, func.args);
    } else {
      this.recover();
    }
  }

  private handleSpeechDone() {
    log('Handling speech done');
    if (this.endCallOnSpeechDone) {
      setTimeout(() => {
        this.emit('end');
      }, 1000);
    } else {
      this.enqueue(CallEvent.SPEECH_ENDED);
    }
  }

  private handleSpeechError(err: any) {
    log('Handling speech error', LogLevel.ERROR);
    this.enqueue(CallEvent.SPEECH_ERROR);
  }

  private handleEndCall() {
    log('Handling end call');
    this.emit('end');
  }

  private handleHoldCall() {
    log('Handling hold call');
    this.isHolding = true;
  }

  private executeFunction(func: ActionFunction, args: any) {
    log(`Executing function: ${func.name}}`);
    if (func.name === 'end_call') {
      this.hoistFunctionMessages(func.name, args);
      this.respond();
      this.endCallOnSpeechDone = true;
    } else if (func.name === 'hold_call') {
      this.hoistFunctionMessages(func.name, args);
      this.isHolding = true;
      this.respond();
    } else {
      ActionService.execute(func.action_id, args)
        .then((res) => {
          log(res);
        })
        .catch((err) => {
          log(err);
        });
    }
  }

  private hoistFunctionMessages(name: string, args: any) {
    this.appendMessage({
      role: Role.ASSISTANT,
      content: null,
      function_call: {
        name,
        arguments: JSON.stringify(args),
      },
      start: now(),
      end: now(),
    });

    this.appendMessage({
      role: Role.FUNCTION,
      name: name,
      content: JSON.stringify({ success: true }),
      start: now(),
      end: now(),
    });
  }

  private hoistGreeting() {
    log('Hoisting greeting for pregeneration');
    this.appendMessage({
      role: Role.USER,
      content: getHoistedGreetingContent(this.language),
      start: now(),
      end: now(),
    });
  }

  private stripHoistedGreeting() {
    log('Removing hoisted greeting');
    try {
      if (this.messages[0].content.startsWith('Hello')) {
        this.messages[0].content = this.messages[0].content.replace('Hello? ', '');
      }
    } catch (err) {
      log('Error removing hoisted greeting', LogLevel.ERROR);
      captureException(err);
    }
  }

  private monitorInactivity(event: CallEvent) {
    log(`Monitoring inactivity for event ${event}`);
    switch (event) {
      case CallEvent.CALL_CONNECTED_INBOUND:
      case CallEvent.CALL_CONNECTED_OUTBOUND:
      case CallEvent.SPEECH_ENDED:
        this.inactivityTimeout = setTimeout(() => {
          this.checkInactivity();
        }, 8000);
        break;

      case CallEvent.TRANSCRIPT_PARTIAL:
      case CallEvent.TRANSCRIPT_FULL:
      case CallEvent.TRANSCRIPT_FINAL:
        this.clearInactivity();
        break;
    }
  }

  private checkInactivity() {
    log(`Enqueuing inactivity check ${this.inactivityCount}`);
    if (this.inactivityCount === 0) {
      this.enqueue(CallEvent.INACTIVITY_FIRST);
    } else if (this.inactivityCount === 1) {
      this.enqueue(CallEvent.INACTIVITY_SECOND);
    } else if (this.inactivityCount > 1) {
      this.enqueue(CallEvent.INACTIVITY_THIRD);
    }
    this.inactivityCount++;
  }

  private clearInactivity() {
    this.inactivityCount = 0;
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = undefined;
    }
  }

  private cleanup() {
    log('Cleaning up speech');
    if (this.speech) {
      this.speech.destroy();
      this.speech = undefined;
    }
  }

  private abort() {
    log('Aborting speech');
    if (this.speech) {
      this.speech.destroy();
      this.speech = undefined;
    }
  }

  public destroy() {
    log(`Destroying agent`);
    this.abort();
    this.clearInactivity();
    this.queue.length = 0;
    this.isProcessing = false;
    this.removeAllListeners();
  }
}
