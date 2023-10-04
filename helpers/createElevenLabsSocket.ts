import { WebSocket } from 'ws';

export enum ElevenLabsModel {
  MULTILINGUAL_V2 = 'eleven_multilingual_v2',
  MULTILINGUAL_V1 = 'eleven_multilingual_v1',
  ENGLISH_V1 = 'eleven_monolingual_v1',
}

export enum OutputFormat {
  PCM_16000 = 'pcm_16000',
}

export type OpenElevenLabsSocketProps = {
  model: ElevenLabsModel;
  voiceId: string;
  stability: number;
  similarityBoost: number;
  optimizeStreamingLatency: number;
  outputFormat: OutputFormat;
};

export function openElevenLabsSocket({
  model,
  voiceId,
  stability,
  similarityBoost,
  optimizeStreamingLatency,
  outputFormat,
}: OpenElevenLabsSocketProps) {
  const API_KEY = process.env.ELEVENLABS_API_KEY as string;
  const BASE_URL = 'wss://api.elevenlabs.io/v1/text-to-speech';
  const URL = `${BASE_URL}/${voiceId}/stream-input`;
  const PARAMS = `?model_id=${model}&optimize_streaming_latency=${optimizeStreamingLatency}&output_format=${outputFormat}`;
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
