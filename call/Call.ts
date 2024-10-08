import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { Agent } from '../agent/Agent';
import { captureException } from '../helpers/captureException';
import CallService from '../services/CallService';
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
  public id: string;
  private direction: CallDirection;
  private transcriber: Transcriber;
  private agent: Agent;
  private start: number;
  private end?: number;
  private missed: boolean;

  constructor({ socket, id, direction, transcriber, agent }: CallConstructor) {
    super();
    this.id = id;
    this.direction = direction;
    this.socket = socket;
    this.socket.on('close', () => this.onSocketClose());
    this.transcriber = transcriber;
    this.transcriber.on('transcript', (transcript: Transcript) => this.onTranscript(transcript));
    this.transcriber.on('error', (err: any) => this.onTranscriberError(err));
    this.agent = agent;
    this.agent.on('speech', (chunk: Buffer) => this.onAgentSpeech(chunk));
    this.agent.on('error', (err: any) => this.onAgentError(err));
    this.agent.on('voicemail_detected', () => this.onVoicemailDetected());
    this.agent.on('end', () => this.onAgentEnd());
    this.start = now();
    this.missed = false;
    this.startCall();
  }

  public processAudio(buffer: Buffer) {
    this.transcriber.send(buffer);
  }

  public processEvent(data: any) {
    switch (data.event) {
      case 'websocket:dtmf':
        this.handleDial(data);
        return;
      default:
        log(`Unhandled event`, LogLevel.WARN);
    }
  }

  private handleDial(data: any) {
    log(`Dial received: ${JSON.stringify(data)}`);
  }

  private onSocketClose() {
    log('Socket closed');
    if (!this.end) {
      this.endCall();
    }
  }

  private onTranscript(transcript: Transcript) {
    log(`Transcript received: ${JSON.stringify(transcript)}`);
    if (!transcript.isFull) {
      this.agent.enqueue(CallEvent.TRANSCRIPT_PARTIAL);
    } else {
      this.appendTranscript(transcript);
      if (!transcript.isFinal) {
        this.agent.enqueue(CallEvent.TRANSCRIPT_FULL);
      } else {
        this.agent.enqueue(CallEvent.TRANSCRIPT_FINAL);
      }
    }
  }

  private appendTranscript(transcript: Transcript) {
    log('Appending transcript to messages');
    const { speech: content, start, end } = transcript;
    const role = Role.USER;
    const message: Message = { role, content, start, end };
    this.agent.appendMessage(message);
  }

  private onTranscriberError(err: Error) {
    log('Transcriber failed', LogLevel.ERROR);
    this.endCall();
  }

  private onAgentSpeech(chunk: Buffer) {
    this.socket.send(chunk);
  }

  private onAgentError(err: Error) {
    log('Agent failed', LogLevel.ERROR);
    this.endCall();
  }

  private onVoicemailDetected() {
    log('Call missed');
    this.missed = true;
  }

  private onAgentEnd() {
    log('Ending call from agent');
    this.endCall();
  }

  private startCall() {
    log(`Call starting ${this.direction}`);
    switch (this.direction) {
      case CallDirection.INBOUND:
        this.agent.enqueue(CallEvent.CALL_CONNECTED_INBOUND);
        break;
      case CallDirection.OUTBOUND:
        this.agent.enqueue(CallEvent.CALL_CONNECTED_OUTBOUND);
        break;
      default:
        log(`Invalid direction:`, this.direction);
        break;
    }
  }

  private endCall() {
    log(`Ending call`);
    this.end = now();
    if (this.socket.readyState !== 3) {
      this.socket.close();
    }

    CallService.saveCall(this.id, {
      start: this.start,
      end: this.end,
      messages: this.agent.messages,
      missed: this.missed,
    }).catch((err) => {
      captureException(err);
    });

    this.destroy();
  }

  public destroy() {
    log(`Destroying call`);
    this.transcriber.destroy();
    this.agent.destroy();
    this.removeAllListeners();
  }
}
