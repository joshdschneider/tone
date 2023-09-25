import { ConnectionState } from '@deepgram/sdk/dist/enums';
import { LiveTranscription } from '@deepgram/sdk/dist/transcription/liveTranscription';
import {
  Alternative,
  LiveTranscriptionOptions,
  LiveTranscriptionResponse,
} from '@deepgram/sdk/dist/types';
import { EventEmitter } from 'ws';
import { captureException } from '../helpers/captureException';
import { Transcript } from '../types';
import { deepgram } from '../utils/deepgram';
import { log } from '../utils/log';

export class Transcriber extends EventEmitter {
  private connection: LiveTranscription;

  constructor(options: LiveTranscriptionOptions) {
    super();
    this.connection = deepgram.transcription.live(options);
    this.bindConnectionListeners();
  }

  private bindConnectionListeners() {
    this.connection.on('open', this.handleConnectionOpen.bind(this));
    this.connection.on('close', this.handleConnectionClose.bind(this));
    this.connection.on('error', this.handleConnectionError.bind(this));
    this.connection.on('transcriptReceived', this.handleTranscript.bind(this));
  }

  private handleConnectionOpen() {
    log(`Transcriber connection open`);
    this.emit('open');
  }

  private handleConnectionClose() {
    log(`Transcriber connection closed`);
    this.cleanup();
    this.emit('close');
  }

  private handleConnectionError(err: Error) {
    captureException(err);
    this.emit('error', err);
  }

  private handleTranscript(message: string) {
    let response: LiveTranscriptionResponse;
    let alternative: Alternative;

    try {
      response = JSON.parse(message);
      alternative = response.channel.alternatives[0];
    } catch (err) {
      captureException(err);
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

  public send(audio: Buffer) {
    const state = this.connection.getReadyState();
    if (state === ConnectionState.OPEN) {
      this.connection.send(audio);
    }
  }

  public close() {
    log(`Closing transcriber connection`);
    this.connection.finish();
  }

  public cleanup() {
    log(`All listeners removed from Transcriber`);
    this.connection.removeAllListeners();
  }
}
