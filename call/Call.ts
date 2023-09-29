import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { Agent } from '../agent/Agent';
import { Transcriber } from '../transcriber/Transcriber';
import { CallDirection, CallEvent, Message, Role, Transcript } from '../types';
import { LogLevel, log } from '../utils/log';
import { now } from '../utils/now';

export type CallConstructor = {
  socket: WebSocket;
  id: string;
  direction: CallDirection;
  transcriber: Transcriber;
  agent: Agent;
};

export class Call extends EventEmitter {
  private socket: WebSocket;
  private id: string;
  private direction: CallDirection;
  private transcriber: Transcriber;
  private agent: Agent;
  private start: number;
  private end?: number;

  constructor({ socket, id, direction, transcriber, agent }: CallConstructor) {
    super();
    this.socket = socket;
    this.id = id;
    this.direction = direction;
    this.transcriber = transcriber;
    this.agent = agent;
    this.start = now();
    this.bindCallListeners();
  }

  private bindCallListeners() {
    this.socket.on('close', () => this.onSocketClose());
    this.transcriber.on('transcript', (transcript: Transcript) => this.onTranscript(transcript));
    this.transcriber.on('error', (err: any) => this.onTranscriberError(err));
    this.transcriber.on('fatal', () => this.onTranscriberFatal());
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
    log('Socket closed');
    this.endCall();
  }

  private onTranscript(transcript: Transcript) {
    log(`Transcript received: ${JSON.stringify(transcript)}`);
    if (!transcript.isFinal) {
      this.agent.enqueue(CallEvent.TRANSCRIPT_PARTIAL);
    } else {
      this.appendTranscript(transcript);
      if (!transcript.isEndpoint) {
        this.agent.enqueue(CallEvent.TRANSCRIPT_FULL);
      } else {
        this.agent.enqueue(CallEvent.TRANSCRIPT_ENDPOINT);
      }
    }
  }

  private appendTranscript(transcript: Transcript) {
    const { speech: content, start, end } = transcript;
    const role = Role.USER;
    const message: Message = { role, content, start, end };
    this.agent.appendMessage(message);
  }

  private onTranscriberError(err: Error) {
    // log(JSON.stringify({ event: Event.TRANSCRIBER_ERROR }));
  }

  private onTranscriberFatal() {
    // log(JSON.stringify({ event: Event.TRANSCRIBER_FATAL }));
  }

  private endCall() {
    log(`Ending call`);
    this.end = now();
    if (!this.socket.CLOSED) {
      this.socket.close();
    }

    log(
      JSON.stringify({
        start: this.start,
        end: this.end,
        messages: this.agent.messages,
      })
    );

    this.destroy();
  }

  public destroy() {
    log(`Destroying call`);
    this.transcriber.destroy();
    this.agent.destroy();
    this.removeAllListeners();
  }
}
