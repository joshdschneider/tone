import { RimeSynthesizer, RimeSynthesizerConstructor } from './RimeSynthesizer';

export function createRimeSynthesizer(props: RimeSynthesizerConstructor) {
  return new RimeSynthesizer(props);
}
