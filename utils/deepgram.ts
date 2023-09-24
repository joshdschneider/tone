import { Deepgram } from '@deepgram/sdk';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY as string;

export const deepgram = new Deepgram(DEEPGRAM_API_KEY);
