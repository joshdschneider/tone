import { DEFAULT_PROMPT } from '../utils/constants';
import { TIMEZONES } from '../utils/timezones';

function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

function getToday(timezone?: string): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone || 'UTC',
  };

  const formattedDate = formatDate(now, options);
  return formattedDate;
}

function getTimezone(timezone: string | null) {
  const tz = TIMEZONES.find((t) => t.value === (timezone || 'Eastern Standard Time'));
  return tz?.utc[0] || 'America/New_York';
}

export function wrapPrompt(prompt: string | null, timezone: string | null) {
  const tz = getTimezone(timezone);
  const today = getToday(tz);
  const metaprompt = `You are an AI agent talking to a human over the phone. Today is ${today}. Your responses are short (1-2 sentences) and conversational (no numbered lists or code snippets). Follow the prompt below as closely as possible:`;
  return `${metaprompt}\n\n"""${prompt || DEFAULT_PROMPT}"""`;
}
