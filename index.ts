import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import http from 'http';
import { Server as WebSocketServer } from 'ws';
import { captureException } from './helpers/captureException';
import { handleConnection } from './helpers/handleConnection';
import { sampleRates } from './utils/sentry';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [new ProfilingIntegration()],
  tracesSampleRate: sampleRates.traces,
  profilesSampleRate: sampleRates.profiles,
});

const port = Number(process.env.PORT) || 5555;
const message = `Websocket server started on port ${port}`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(message);
});

server.on('error', captureException);
server.listen(port, () => console.log(message));

const wss = new WebSocketServer({ server });

wss.on('connection', handleConnection);
wss.on('error', captureException);
