import WebSocket, { EventEmitter } from 'ws';
import { Agent } from '../agent/Agent';
import { captureException } from '../helpers/captureException';
import { transition } from '../helpers/transition';
import CallService from '../services/CallService';
import { Synthesizer } from '../synthesizer/Synthesizer';
import { Transcriber } from '../transcriber/Transcriber';
import { CallDirection, Event, Message, QueueEvent, Role, Transcript } from '../types';
import { MESSAGE_TIMESTAMP_DELTA } from '../utils/constants';
import { LogLevel, log } from '../utils/log';
import { now } from '../utils/now';

export type CallConstructor = {
  socket: WebSocket;
  id: string;
  direction: CallDirection;
  transcriber: Transcriber;
  agent: Agent;
  synthesizer: Synthesizer;
};

export class Call extends EventEmitter {
  private socket: WebSocket;
  private id: string;
  private direction: CallDirection;
  private transcriber: Transcriber;
  private agent: Agent;
  private synthesizer: Synthesizer;
  private start: number;
  private end?: number;
  private messages: Message[];
  private queue: QueueEvent[];
  private isProcessing: boolean;

  constructor({ socket, id, direction, transcriber, agent, synthesizer }: CallConstructor) {
    super();
    this.socket = socket;
    this.id = id;
    this.direction = direction;
    this.transcriber = transcriber;
    this.agent = agent;
    this.synthesizer = synthesizer;
    this.start = now();
    this.messages = [];
    this.queue = [];
    this.isProcessing = false;
    this.bindCallListeners();
  }

  private bindCallListeners() {
    this.socket.on('close', this.onSocketClose);
    this.transcriber.on('transcript', this.onTranscript);
    this.transcriber.on('error', this.onTranscriberError);
    this.agent.on('generatedText', this.onGeneratedText);
    this.agent.on('generationStarted', this.onGenerationStarted);
    this.agent.on('generationEnded', this.onGenerationEnded);
    this.agent.on('generationError', this.onGenerationError);
    this.synthesizer.on('synthesizedSpeech', this.onSynthesizedSpeech);
    this.synthesizer.on('synthesisStarted', this.onSynthesisStarted);
    this.synthesizer.on('synthesisEnded', this.onSynthesisEnded);
    this.synthesizer.on('synthesisError', this.onSynthesisError);
  }

  public processAudio(buffer: Buffer) {
    this.transcriber.send(buffer);
  }

  public processEvent(data: any) {
    switch (data.event) {
      case 'websocket:dtmf':
        this.handleDial(data);
      default:
        log(`Unhandled event`, LogLevel.WARN);
    }
  }

  private handleDial(data: any) {
    log(`Dial received: ${JSON.stringify(data)}`);
  }

  private onSocketClose() {
    log('Ending call...');
    this.endCall();
  }

  private onTranscript(transcript: Transcript) {
    log(`Transcript received: ${JSON.stringify(transcript)}`);
    if (!transcript.isFinal) {
      this.enqueue({
        event: Event.TRANSCRIPT_PARTIAL,
        payload: { transcript },
      });
    } else {
      if (!transcript.isEndpoint) {
        this.enqueue({
          event: Event.TRANSCRIPT_FULL,
          payload: { transcript },
        });
      } else {
        this.enqueue({
          event: Event.TRANSCRIPT_ENDPOINT,
          payload: { transcript },
        });
      }
    }
  }

  private onTranscriberError(err: Error) {
    // ??
  }

  private onGeneratedText(text: string) {
    this.synthesizer.send(text);
  }

  private onGenerationStarted() {
    this.enqueue({ event: Event.GENERATION_STARTED });
  }

  private onGenerationEnded() {
    this.enqueue({ event: Event.GENERATION_ENDED });
  }

  private onGenerationError(err: Error) {
    this.enqueue({ event: Event.GENERATION_ERROR });
  }

  private onSynthesizedSpeech(buffer: Buffer) {
    this.socket.send(buffer);
  }

  private onSynthesisStarted() {
    this.enqueue({ event: Event.SYNTHESIS_STARTED });
  }

  private onSynthesisEnded() {
    this.enqueue({ event: Event.SYNTHESIS_ENDED });
  }

  private onSynthesisError(err: Error) {
    this.enqueue({ event: Event.SYNTHESIS_ERROR });
  }

  private enqueue(event: QueueEvent) {
    log(`Enqueueing event: ${JSON.stringify(event)}`);
    this.queue.push(event);
    if (!this.isProcessing) {
      this.dequeue();
    }
  }

  private dequeue() {
    log(`Dequeueing event`);
    if (this.queue.length === 0) {
      log(`Stopping: no events in queue`);
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const event = this.queue.shift();
    if (event) {
      this.process(event);
      this.dequeue();
    } else {
      log(`Dequeue attempted: event not found`, LogLevel.WARN);
    }
  }

  private process(event: QueueEvent) {
    log(`Processing event: ${JSON.stringify(event)}`);
    transition({
      currentState: this.agent.state,
      queueEvent: event,
      greeting: this.agent.greeting,
      setState: this.agent.setState,
      generate: this.agent.generate,
      cancelGeneration: this.agent.cancel,
      cancelSynthesis: this.synthesizer.cancel,
      appendTranscript: this.appendTranscript,
    });
  }

  private appendMessage(message: Message) {
    log(`Appending message: ${JSON.stringify(message)}`);
    if (this.messages.length === 0) {
      this.messages.push(message);
      return;
    }

    const prev = this.messages[this.messages.length - 1];
    const sameRole = message.role === prev.role;
    if (sameRole) {
      const delta = MESSAGE_TIMESTAMP_DELTA;
      const sameUtterance = !prev.end || message.start - prev.end <= delta;
      if (sameUtterance) {
        prev.content += ` ${message.content}`;
        prev.end = message.end;
        return;
      }
    }

    this.messages.push(message);
  }

  private appendTranscript(transcript: Transcript) {
    const message: Message = {
      role: Role.USER,
      content: transcript.speech,
      start: transcript.start,
      end: transcript.end,
    };

    this.appendMessage(message);
  }

  private cleanup() {
    this.socket.removeAllListeners();
    this.transcriber.removeAllListeners();
    this.agent.removeAllListeners();
    this.synthesizer.removeAllListeners();
  }

  private endCall() {
    this.end = now();
    if (!this.socket.CLOSED) {
      this.socket.close();
    }

    this.cleanup();
    CallService.endCall(this.id, {
      start: this.start,
      end: this.end,
      messages: this.messages,
    })
      .then(() => {
        log('Call ended successfully');
      })
      .catch((err) => {
        log('Failed to end call');
        captureException(err);
      });
  }
}
