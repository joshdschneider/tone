import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import express from 'express';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { captureException } from './helpers/captureException';
import { handleConnection } from './helpers/handleConnection';
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

app.get('/health', (req, res) => {
  res.send('OK');
});

const server = createServer(app);
const wss = new WebSocketServer({ server });
wss.on('connection', handleConnection);
wss.on('error', captureException);

server.listen(port, () => {
  log(`Websocket server started on port ${port}`);
});
