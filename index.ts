import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import express from 'express';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { captureException } from './helpers/captureException';
import { handleConnection } from './helpers/handleConnection';
import { CallSocket } from './types';
import { log } from './utils/log';
import { sampleRates } from './utils/sentry';

const app = express();
const port = Number(process.env.PORT) || 5555;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [new ProfilingIntegration()],
  tracesSampleRate: sampleRates.traces,
  profilesSampleRate: sampleRates.profiles,
});

const server = createServer(app);
const wss = new WebSocketServer({ server });
wss.on('connection', handleConnection);
wss.on('error', captureException);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/:call_id/voicemail', async (req, res) => {
  wss.clients.forEach((client: CallSocket) => {
    if (client.callId === req.params.call_id) {
      const message = JSON.stringify({ event: 'websocket:voicemail' });
      client.emit('message', message);
    }
  });
  return res.status(200).send('OK');
});

server.listen(port, () => {
  log(`Websocket server started on port ${port}`);
});
