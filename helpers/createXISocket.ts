import { WebSocket } from 'ws';
import { ElevenLabsModel } from '../synthesizer/createSynthesizer';
import { log } from '../utils/log';

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY as string;

type CreateXISocketProps = {
  model: ElevenLabsModel;
  voiceId: string;
  stability: number;
  similarityBoost: number;
  optimizeStreamingLatency: number;
};

export function createXISocket({
  model,
  voiceId,
  stability,
  similarityBoost,
  optimizeStreamingLatency,
}: CreateXISocketProps) {
  const BASE_URL = `wss://api.elevenlabs.io/v1/text-to-speech`;
  const URL = `${BASE_URL}/${voiceId}/stream-input?model_id=${model}&optimize_streaming_latency=${optimizeStreamingLatency.toString()}`;
  const socket = new WebSocket(URL);

  socket.onopen = function (event) {
    const bosMessage = {
      text: ' ',
      voice_settings: {
        stability: stability,
        similarity_boost: similarityBoost,
      },
      xi_api_key: elevenLabsApiKey,
    };

    socket.send(JSON.stringify(bosMessage));
    log(`Synthesizer connection open`);
  };

  return socket;
}
