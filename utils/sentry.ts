const tracesSampleRate = process.env.SENTRY_TRACES_SAMPLE_RATE;
const profilesSampleRate = process.env.SENTRY_PROFILES_SAMPLE_RATE;

export const sampleRates = {
  traces: tracesSampleRate ? parseFloat(tracesSampleRate) : undefined,
  profiles: profilesSampleRate ? parseFloat(profilesSampleRate) : undefined,
};
