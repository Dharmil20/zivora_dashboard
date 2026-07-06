// ──────────────────────────────────────────────
// Pino Logger
// ──────────────────────────────────────────────
// Single logger instance, reused across the entire app.
// - Dev: pretty-printed via pino-pretty transport
// - Production: structured JSON (fast, machine-parseable)
//
// Easy to extend later:
//   • Per-env log levels (see `level` below)
//   • Redaction rules (uncomment `redact` to mask secrets)
//   • Shipping to a log aggregator (add a second transport target)

import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  // Adjust per environment: 'debug' locally, 'info' in prod
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),

  // Redaction — uncomment to mask sensitive fields automatically:
  // redact: {
  //   paths: ["req.headers.authorization", "req.body.password"],
  //   censor: "[REDACTED]",
  // },

  // Pretty-print in development, structured JSON in production
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }),
});
