import { EventEmitter } from 'events';

export type SynthesisOptions = {
  fromCache?: boolean;
  cacheKey?: string;
};

export abstract class Synthesizer extends EventEmitter {
  constructor() {
    super();
  }

  abstract synthesize(text: string, opts?: SynthesisOptions): void;

  abstract destroy(): void;
}
