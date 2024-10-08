import { RawData, WebSocket } from 'ws';
import { captureException } from '../helpers/captureException';
import ElevenLabsService from '../services/ElevenLabsService';
import { VoiceOptions } from '../types';
import { LogLevel, log } from '../utils/log';
import { Synthesizer } from './Synthesizer';

export enum ElevenLabsModel {
  MULTILINGUAL_V2 = 'eleven_multilingual_v2',
  MULTILINGUAL_V1 = 'eleven_multilingual_v1',
  ENGLISH_V1 = 'eleven_monolingual_v1',
}

export enum OutputFormat {
  PCM_16000 = 'pcm_16000',
}

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
  private terminate?: boolean;

  constructor({ voiceOptions, language }: ElevenLabsSynthesizerConstructor) {
    super();
    const options = voiceOptions || DEFAULT_OPTIONS;
    const model = this.getModel(language);
    this.socket = ElevenLabsService.textToSpeechStream({
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
    if (this.socket && this.terminate) {
      log('Terminating socket on open');
      this.socket.terminate();
      this.socket.removeAllListeners();
      this.socket = undefined;
      this.terminate = undefined;
      return;
    }

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

    try {
      const str = data.toString('utf8');
      const msg = JSON.parse(str);
      if (!msg.audio) {
        return;
      } else {
        audio = msg.audio;
        if (msg.normalizedAlignment && msg.normalizedAlignment.chars) {
          text = msg.normalizedAlignment.chars.join('');
        }
      }
    } catch (_) {
      log('Failed to parse message from ElevenLabs', LogLevel.ERROR);
      return;
    }

    const buffer = Buffer.from(audio, 'base64');
    this.enqueueOutput({ audio: buffer, text });
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
      if (this.socket.readyState === 1) {
        this.socket.terminate();
        this.socket.removeAllListeners();
        this.socket = undefined;
      } else if (this.socket.readyState === 0) {
        this.terminate = true;
      } else {
        this.socket.removeAllListeners();
        this.socket = undefined;
      }
    }
  }

  public destroy(): void {
    log(`Destroying ElevenLabs synthesizer`);
    this.close();
    super.destroy();
  }
}
