type Level = "debug" | "info" | "warn" | "error";

function log(level: Level, scope: string, message: string, meta?: Record<string, unknown>) {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${scope}] ${message}`;
  const payload = meta ? `${line} ${JSON.stringify(meta)}` : line;

  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.log(payload);
}

export const logger = {
  debug: (scope: string, message: string, meta?: Record<string, unknown>) =>
    log("debug", scope, message, meta),
  info: (scope: string, message: string, meta?: Record<string, unknown>) =>
    log("info", scope, message, meta),
  warn: (scope: string, message: string, meta?: Record<string, unknown>) =>
    log("warn", scope, message, meta),
  error: (scope: string, message: string, meta?: Record<string, unknown>) =>
    log("error", scope, message, meta),
};
