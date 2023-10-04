import { RawData, WebSocket } from 'ws';
import { captureException } from '../helpers/captureException';
import {
  ElevenLabsModel,
  OutputFormat,
  openElevenLabsSocket,
} from '../helpers/createElevenLabsSocket';
import { VoiceOptions } from '../types';
import { LogLevel, log } from '../utils/log';
import { Synthesizer } from './Synthesizer';

export type ElevenLabsSynthesizerConstructor = {
  voiceOptions?: VoiceOptions;
  language?: string;
};

const DEFAULT_OPTIONS = {
  id: 'EXAVITQu4vr4xnSDxMaL',
  name: 'Bella',
  stability: 0.9,
  similarity_boost: 0.75,
};

export class ElevenLabsSynthesizer extends Synthesizer {
  private socket?: WebSocket;

  constructor({ voiceOptions, language }: ElevenLabsSynthesizerConstructor) {
    super();
    const options = voiceOptions || DEFAULT_OPTIONS;
    const model = this.getModel(language);
    this.socket = openElevenLabsSocket({
      model,
      voiceId: options.id,
      stability: options.stability || DEFAULT_OPTIONS.stability,
      similarityBoost: options.similarity_boost || DEFAULT_OPTIONS.similarity_boost,
      optimizeStreamingLatency: 2,
      outputFormat: OutputFormat.PCM_16000,
    });

    this.socket.on('open', () => this.handleSocketOpen());
    this.socket.on('message', (data: RawData) => this.handleSocketMessage(data));
    this.socket.on('close', () => this.handleSocketClose());
    this.socket.on('error', (err: any) => this.handleSocketError(err));
  }

  private getModel(language?: string) {
    return !language || language === 'en-US'
      ? ElevenLabsModel.ENGLISH_V1
      : ElevenLabsModel.MULTILINGUAL_V1;
  }

  private handleSocketOpen() {
    log('ElevenLabs socket open');
    this.startInputProcessing();
  }

  public synthesize(text: string): void {
    const endSpace = text[text.length - 1] === ' ';
    const chunk = endSpace ? text : text + ' ';
    const message = {
      text: chunk,
      try_trigger_generation: true,
    };

    try {
      const payload = JSON.stringify(message);
      this.send(payload);
    } catch (_) {
      log('Failed to stringify payload', LogLevel.ERROR);
    }
  }

  private send(message: string) {
    if (this.socket && this.socket.readyState === 1) {
      log(`Sending message to ElevenLabs: ${message}`);
      this.socket.send(message);
    } else {
      log(`Synthesizer connection not open`, LogLevel.WARN);
    }
  }

  private handleSocketMessage(data: RawData) {
    let audio: string;
    let text: string | undefined;
    let isFinal: boolean;

    try {
      const str = data.toString('utf8');
      const msg = JSON.parse(str);
      if (!msg.audio) {
        return;
      } else {
        audio = msg.audio;
        isFinal = !!msg.isFinal;
        if (msg.normalizedAlignment && msg.normalizedAlignment.chars) {
          text = msg.normalizedAlignment.chars.join('');
        }
      }
    } catch (_) {
      log('Failed to parse message from ElevenLabs', LogLevel.ERROR);
      return;
    }

    const buffer = Buffer.from(audio, 'base64');
    this.enqueueOutput({ audio: buffer, text, isFinal });
  }

  public finish() {
    log('Finishing ElevenLabs stream');
    const message = {
      text: '',
    };

    try {
      const payload = JSON.stringify(message);
      this.send(payload);
    } catch (_) {
      log('Failed to stringify payload', LogLevel.ERROR);
    }
  }

  private handleSocketClose() {
    log('ElevenLabs connection closed');
    this.emit('done');
  }

  private handleSocketError(err: any) {
    log('ElevenLabs error', LogLevel.ERROR);
    captureException(err);
    this.emit('error');
  }

  private close() {
    if (this.socket) {
      try {
        this.socket.terminate();
      } catch (err) {
        log(`Failed to terminate ElevenLabs socket`, LogLevel.ERROR);
        captureException(err);
      }

      this.socket.removeAllListeners();
      this.socket = undefined;
    }
  }

  public destroy(): void {
    log(`Destroying ElevenLabs synthesizer`);
    this.close();
    super.destroy();
  }
}
