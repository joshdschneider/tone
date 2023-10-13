import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { createVadSocket } from '../helpers/createVadSocket';

export class Vad extends EventEmitter {
  private socket: WebSocket;
  constructor() {
    super();
    this.socket = createVadSocket();
    this.socket.on('open', () => this.handleSocketOpen());
  }

  private handleSocketOpen() {
    console.log('Socket open');
  }

  public send(buffer: Buffer) {
    this.socket.send(buffer);
  }
}
