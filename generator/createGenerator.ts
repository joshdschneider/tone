import { Generator, GeneratorConstructor } from './Generator';

export function createGenerator(props: GeneratorConstructor) {
  return new Generator(props);
}
