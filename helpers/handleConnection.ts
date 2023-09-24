import WebSocket from 'ws';

export function handleConnection(ws: WebSocket.WebSocket) {
  console.log('New client connected.');

  ws.on('message', (message: WebSocket.RawData) => {
    console.log(`Received message: ${message}`);
  });

  ws.on('error', (err: Error) => {
    console.error(`WebSocket Error: ${err.message}`);
  });

  ws.on('close', (code: number, reason: Buffer) => {
    console.log(`Client disconnected with code: ${code}, reason: ${reason.toString()}`);
  });
}
