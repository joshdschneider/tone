import { WebSocket } from 'ws';

export function createVadSocket() {
  const socket = new WebSocket('http://localhost:8765');
  return socket;
}
