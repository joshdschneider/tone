import { WebSocket } from 'ws';
import { ElevenLabsModel } from '../synthesizer/ElevenLabsSynthesizer';

type OpenElevenLabsSocketProps = {
  model: ElevenLabsModel;
  voiceId: string;
  stability: number;
  similarityBoost: number;
  optimizeStreamingLatency: number;
};

export function openElevenLabsSocket({
  model,
  voiceId,
  stability,
  similarityBoost,
  optimizeStreamingLatency,
}: OpenElevenLabsSocketProps) {
  const API_KEY = process.env.ELEVENLABS_API_KEY as string;
  const BASE_URL = 'wss://api.elevenlabs.io/v1/text-to-speech';
  const URL = `${BASE_URL}/${voiceId}/stream-input`;
  const PARAMS = `?model_id=${model}&optimize_streaming_latency=${optimizeStreamingLatency}`;
  const socket = new WebSocket(URL + PARAMS);

  socket.onopen = function (event) {
    const bosMessage = {
      text: ' ',
      voice_settings: {
        stability: stability,
        similarity_boost: similarityBoost,
      },
      xi_api_key: API_KEY,
    };
    socket.send(JSON.stringify(bosMessage));
  };

  return socket;
}
