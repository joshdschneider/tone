import WebSocket, { EventEmitter } from 'ws';
import { Agent } from '../agent/Agent';
import { Transcriber } from '../transcriber/Transcriber';
import { CallDirection, Transcript } from '../types';

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
    this.start = Date.now();
    this.bindCallListeners();
  }

  private bindCallListeners() {
    this.transcriber.on('transcript', this.onTranscript.bind(this));
    this.socket.on('close', this.onWebsocketClose.bind(this));
    this.socket.on('error', this.onWebsocketError.bind(this));
  }

  private onTranscript(transcript: Transcript) {
    //..
  }

  private onWebsocketClose() {
    //..
  }

  private onWebsocketError() {
    //..
  }

  public processEvent() {
    //..
  }

  public processAudio() {
    //..
  }
}
