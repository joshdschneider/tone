import { Response, ResponseConstructor } from './Response';

export function createResponse(props: ResponseConstructor) {
  return new Response(props);
}
