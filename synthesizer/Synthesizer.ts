import WebSocket, { EventEmitter, RawData } from 'ws';
import { captureException } from '../helpers/captureException';
import { createXISocket } from '../helpers/createXISocket';
import { VoiceProvider } from '../types';
import { LogLevel, log } from '../utils/log';
import { ElevenLabsModel } from './createSynthesizer';

export type SynthesizerConstructor = {
  provider: VoiceProvider;
  model: ElevenLabsModel;
  voiceId: string;
  stability: number;
  similarityBoost: number;
  optimizeStreamingLatency: number;
};

export class Synthesizer extends EventEmitter {
  private connection?: WebSocket.WebSocket;
  private model: ElevenLabsModel;
  private voiceId: string;
  private stability: number;
  private similarityBoost: number;
  private optimizeStreamingLatency: number;
  private speaking: boolean;
  private errorCount: number;
  private maxErrors: number;

  constructor({
    provider,
    model,
    voiceId,
    stability,
    similarityBoost,
    optimizeStreamingLatency,
  }: SynthesizerConstructor) {
    super();
    this.model = model;
    this.voiceId = voiceId;
    this.stability = stability;
    this.similarityBoost = similarityBoost;
    this.optimizeStreamingLatency = optimizeStreamingLatency;
    this.speaking = false;
    this.errorCount = 0;
    this.maxErrors = 3;
    this.connect();
  }

  private connect() {
    this.connection = createXISocket({
      model: this.model,
      voiceId: this.voiceId,
      stability: this.stability,
      similarityBoost: this.similarityBoost,
      optimizeStreamingLatency: this.optimizeStreamingLatency,
    });

    this.bindSocketListeners();
  }

  private bindSocketListeners() {
    if (this.connection) {
      this.connection.on('close', this.handleConnectionClose.bind(this));
      this.connection.on('message', this.handleConnectionMessage.bind(this));
      this.connection.on('error', this.handleError.bind(this));
    } else {
      log(`Failed to bind synthesis listeners`, LogLevel.WARN);
    }
  }

  private handleConnectionClose() {
    log('Synthesizer connection closed');
  }

  private handleError(err: Error) {
    captureException(err);
    this.errorCount++;
    if (this.errorCount >= this.maxErrors) {
      this.emit('fatal');
    } else {
      this.emit('error', err);
    }
  }

  private handleConnectionMessage(data: RawData) {
    try {
      const message = data.toString('utf8');
      const obj = JSON.parse(message);
      if (!obj.audio) {
        return;
      }

      let audio = obj.audio;
      let text: string | undefined;
      if (obj.normalizedAlignment && obj.normalizedAlignment.chars) {
        text = obj.normalizedAlignment.chars.join('');
      }

      if (!this.speaking) {
        this.speaking = true;
        this.emit('synthesisStarted');
      }

      const speech = { audio, text };
      this.emit('speech', speech);

      if (obj.isFinal) {
        this.emit('synthesisEnded');
        this.speaking = false;
      }
    } catch (err) {
      log(`Failed to receive synthesizer message: ${err}`, LogLevel.ERROR);
    }
  }

  public send(text: string) {
    if (!this.connection) {
      const err = new Error('Synthesizer connection undefined');
      this.handleError(err);
      return;
    }

    if (this.connection.readyState === 1) {
      const message = {
        text: text + ' ',
        try_trigger_generation: true,
      };

      const payload = JSON.stringify(message);
      this.connection.send(payload);
    } else {
      log(`Synthesizer connection not ready`, LogLevel.WARN);
    }
  }

  public finish() {
    log(`Finishing synthesis`);
    const message = { text: '' };
    const payload = JSON.stringify(message);
    this.send(payload);
    this.restart();
  }

  public restart() {
    log(`Restarting synthesizer connection`);
    this.close();
    this.connect();
  }

  public close() {
    log(`Removing synthesizer connection`);
    this.speaking = false;
    if (this.connection) {
      if (!this.connection.CLOSED) {
        this.connection.close();
      }

      this.connection.removeAllListeners();
      this.connection = undefined;
    }
  }

  public destroy() {
    log(`Destroying synthesizer`);
    this.close();
    this.removeAllListeners();
  }
}
