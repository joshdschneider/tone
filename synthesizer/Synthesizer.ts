import { EventEmitter } from 'events';
import { SynthesisChunk, TextChunk } from '../types';
import { log } from '../utils/log';

export abstract class Synthesizer extends EventEmitter {
  private inputQueue: TextChunk[];
  private outputQueue: SynthesisChunk[];
  private outputQueueProcessing: boolean;
  private isReady: boolean;

  constructor() {
    super();
    this.inputQueue = [];
    this.outputQueue = [];
    this.outputQueueProcessing = false;
    this.isReady = false;
  }

  public enqueueInput(chunk: TextChunk) {
    log(`Enqueueing input chunk`);
    this.inputQueue.push(chunk);
    if (this.isReady) {
      this.dequeueInput();
    }
  }

  private dequeueInput() {
    if (this.inputQueue.length === 0) {
      log(`Stopping empty input queue`);
      return;
    }

    log(`Dequeueing input chunk`);
    const chunk = this.inputQueue.shift();
    if (chunk) {
      this.processInput(chunk);
      this.dequeueInput();
    }
  }

  public processInput(chunk: TextChunk) {
    log(`Processing input text`);
    this.synthesize(chunk.text);
    if (chunk.isFinal) {
      log(`Finishing input queue`);
      this.finish();
    }
  }

  public startInputProcessing() {
    this.isReady = true;
    if (this.inputQueue.length > 0) {
      log(`Starting input queue processing`);
      this.dequeueInput();
    }
  }

  public enqueueOutput(chunk: SynthesisChunk) {
    log(`Enqueueing output chunk`);
    this.outputQueue.push(chunk);
    if (!this.outputQueueProcessing) {
      this.dequeueOutput();
    }
  }

  private dequeueOutput() {
    if (this.outputQueue.length === 0) {
      log(`Stopping output queue`);
      this.outputQueueProcessing = false;
      return;
    }

    log(`Dequeueing output chunk`);
    this.outputQueueProcessing = true;
    const chunk = this.outputQueue.shift();
    if (chunk) {
      this.processOutput(chunk);
      this.dequeueOutput();
    }
  }

  private processOutput(chunk: SynthesisChunk) {
    log(`Processing synthesis chunk`);
    this.emit('chunk', chunk);
  }

  abstract synthesize(text: string): void;

  abstract finish(): void;

  public destroy() {
    this.inputQueue.length = 0;
    this.outputQueue.length = 0;
    this.outputQueueProcessing = false;
    this.removeAllListeners();
  }
}
