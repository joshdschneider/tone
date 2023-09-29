import { Greeting, GreetingConstructor } from './Greeting';

export function createGreeting(props: GreetingConstructor) {
  return new Greeting(props);
}
