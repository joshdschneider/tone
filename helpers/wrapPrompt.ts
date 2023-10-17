import { DEFAULT_PROMPT } from '../utils/constants';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function today() {
  const now = new Date();
  const day = DAYS[now.getUTCDay()];
  const month = MONTHS[now.getUTCMonth()];
  const date = now.getUTCDate();
  const year = now.getUTCFullYear();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const formattedMinute = minute.toString().padStart(2, '0');
  return `${day}, ${month} ${date}, ${year} at ${formattedHour}:${formattedMinute}${ampm} UTC`;
}

export const METAPROMPT = `You are an AI agent talking to a human over the phone. Today is ${today()}. Your replies are short (1-2 sentences). Follow the prompt below as closely as possible:`;

export function wrapPrompt(prompt: string | null) {
  return `${METAPROMPT}\n\n"""${prompt || DEFAULT_PROMPT}"""`;
}
