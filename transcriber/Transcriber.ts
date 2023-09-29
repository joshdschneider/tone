import { LiveTranscription } from '@deepgram/sdk/dist/transcription/liveTranscription';
import {
  Alternative,
  LiveTranscriptionOptions,
  LiveTranscriptionResponse,
} from '@deepgram/sdk/dist/types';
import { EventEmitter } from 'events';
import { captureException } from '../helpers/captureException';
import { Transcript } from '../types';
import { deepgram } from '../utils/deepgram';
import { LogLevel, log } from '../utils/log';

export class Transcriber extends EventEmitter {
  private options: LiveTranscriptionOptions;
  private connection?: LiveTranscription;
  private errorCount: number;
  private maxErrors: number;

  constructor(options: LiveTranscriptionOptions) {
    super();
    this.options = options;
    this.errorCount = 0;
    this.maxErrors = 3;
    this.connect();
  }

  private connect() {
    this.connection = deepgram.transcription.live(this.options);
    this.bindConnectionListeners();
  }

  private bindConnectionListeners() {
    if (this.connection) {
      this.connection.on('open', this.handleConnectionOpen.bind(this));
      this.connection.on('transcriptReceived', this.handleTranscript.bind(this));
      this.connection.on('close', this.handleConnectionClose.bind(this));
      this.connection.on('error', this.handleError.bind(this));
    } else {
      const err = new Error('Failed to bind listeners to transcriber');
      this.handleError(err);
    }
  }

  private handleConnectionOpen() {
    log(`Transcriber connection open`);
  }

  public send(audio: Buffer) {
    if (this.connection && this.connection.getReadyState() === 1) {
      this.connection.send(audio);
    } else {
      log(`Transcriber not ready`, LogLevel.WARN);
    }
  }

  private handleTranscript(message: string) {
    let response: LiveTranscriptionResponse;
    let alternative: Alternative;

    try {
      response = JSON.parse(message);
      alternative = response.channel.alternatives[0];
    } catch (err: any) {
      this.handleError(err);
      return;
    }

    if (!alternative.transcript) {
      return;
    }

    const timestamp = Date.now();
    const len = Number(response.start) + Number(response.duration);
    const duration = Math.floor(len * 1000);

    const transcript: Transcript = {
      speech: alternative.transcript,
      start: timestamp - duration,
      end: timestamp,
      isFinal: response.is_final,
      isEndpoint: response.speech_final,
    };

    this.emit('transcript', transcript);
  }

  private handleConnectionClose() {
    log(`Transcriber connection closed`);
  }

  private handleError(err: any) {
    captureException(err);
    this.errorCount++;
    if (this.errorCount >= this.maxErrors) {
      this.emit('fatal');
    } else {
      this.emit('error', err);
    }
  }

  public restart() {
    log(`Restarting transcriber connection`);
    this.close();
    this.connect();
  }

  public close() {
    log(`Closing transcriber connection`);
    if (this.connection) {
      if (this.connection.getReadyState() !== 3) {
        this.connection.finish();
      }

      this.connection.removeAllListeners();
      this.connection = undefined;
    }
  }

  public destroy() {
    log(`Destroying transcriber`);
    this.close();
    this.removeAllListeners();
  }
}
