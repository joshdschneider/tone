import WebSocket from 'ws';
import { Call } from '../call/Call';
import { createCall } from '../call/createCall';
import { CallSocket } from '../types';
import { LogLevel, log } from '../utils/log';
import { now } from '../utils/now';
import { captureException } from './captureException';

export function handleConnection(socket: CallSocket) {
  log('New client connected');
  let call: Call | undefined;

  socket.on('message', (message: WebSocket.RawData) => {
    if (call) {
      if (message instanceof Buffer && message.length === 640) {
        call.processAudio(message);
      } else {
        try {
          const data = JSON.parse(message.toString());
          if (data && typeof data === 'object') {
            call.processEvent(data);
          }
        } catch (err: any) {
          log(err, LogLevel.WARN);
        }
      }
    } else {
      try {
        const data = JSON.parse(message.toString());
        if (data && data.event === 'websocket:connected') {
          createCall({ socket, data })
            .then((callInstance) => {
              call = callInstance;
            })
            .catch((err) => {
              captureException(err);
              socket.close();
            });
        }
      } catch (_) {
        log(`Lost audio at ${now()}`, LogLevel.WARN);
      }
    }
  });

  socket.on('error', (err) => {
    captureException(err);
    socket.close();
  });

  socket.on('close', (code: number) => {
    log(`Socket closed with code ${code}`);
    if (call) {
      call.destroy();
      call = undefined;
    }
  });
}
