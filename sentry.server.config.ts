import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  beforeSend(event) {
    // Constitución VI: cero PII en logs. Sanitizamos campos comunes.
    if (event.user) {
      event.user = { id: event.user.id };
    }
    return event;
  },
});
