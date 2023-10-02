import { EventEmitter } from 'events';
import { SynthesisChunk } from '../types';
import { log } from '../utils/log';

export abstract class Synthesizer extends EventEmitter {
  private queue: SynthesisChunk[];
  private isProcessing: boolean;

  constructor() {
    super();
    this.queue = [];
    this.isProcessing = false;
  }

  public enqueue(chunk: SynthesisChunk) {
    log(`Enqueueing synthesis chunk`);
    this.queue.push(chunk);
    if (!this.isProcessing) {
      this.dequeue();
    }
  }

  private dequeue() {
    log(`Dequeueing synthesis chunk`);
    if (this.queue.length === 0) {
      log(`Stopping synthesis queue`);
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const chunk = this.queue.shift();
    if (chunk) {
      this.process(chunk);
      this.dequeue();
    }
  }

  private process(chunk: SynthesisChunk) {
    log(`Processing synthesis chunk`);
    this.emit('chunk', chunk);
  }

  abstract synthesize(text: string): void;

  abstract finish(): void;

  abstract destroy(): void;
}
