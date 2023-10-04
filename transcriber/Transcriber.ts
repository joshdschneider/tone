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
  private confidenceThreshold: number;

  constructor(options: LiveTranscriptionOptions) {
    super();
    this.options = options;
    this.connection = deepgram.transcription.live(this.options);
    this.connection.on('open', () => this.handleConnectionOpen());
    this.connection.on('transcriptReceived', (data: string) => this.handleTranscript(data));
    this.connection.on('close', () => this.handleConnectionClose());
    this.connection.on('error', (err: any) => this.handleConnectionError(err));
    this.confidenceThreshold = 0.9;
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

  private handleTranscript(data: string) {
    let response: LiveTranscriptionResponse;
    let alternative: Alternative;

    try {
      response = JSON.parse(data);
      alternative = response.channel.alternatives[0];
    } catch (_) {
      log('Failed to parse transcript', LogLevel.ERROR);
      return;
    }

    if (!alternative.transcript) {
      return;
    } else if (alternative.confidence < this.confidenceThreshold) {
      return;
    }

    const { transcript: speech, confidence: confidenceScore } = alternative;
    const { start, end } = this.getTimestamps(response.start, response.duration);
    const { is_final: isFull } = response;
    const isFinal = this.isEndOfSpeech(speech, isFull);

    const transcript: Transcript = {
      speech,
      start,
      end,
      isFull,
      isFinal,
      confidenceScore,
    };

    this.emit('transcript', transcript);
  }

  private handleConnectionClose() {
    log(`Transcriber connection closed`);
  }

  private handleConnectionError(err: any) {
    log('Transcriber error', LogLevel.ERROR);
    captureException(err);
    this.emit('error', err);
  }

  private isEndOfSpeech(speech: string, isFull: boolean): boolean {
    let regExp: RegExp;
    if (!isFull) {
      regExp = /[!.?]+$/;
    } else {
      regExp = /[!.,?]+$/;
    }

    return regExp.test(speech.trim());
  }

  private getTimestamps(start: number, duration: number) {
    const timestamp = Date.now();
    const len = Number(start) + Number(duration);
    const dur = Math.floor(len * 1000);
    return { start: timestamp - dur, end: timestamp };
  }

  public close() {
    log(`Closing transcriber connection`);
    if (this.connection) {
      this.connection.finish();
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
