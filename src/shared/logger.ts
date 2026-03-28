// ─────────────────────────────────────────────
// Shared Logger
// ─────────────────────────────────────────────

export type LogLevel = "info" | "warn" | "error" | "debug";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel =
  (process.env["LOG_LEVEL"] as LogLevel | undefined) ?? "info";

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[MIN_LEVEL];
}

function formatMessage(level: LogLevel, stage: string, message: string): string {
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] [${stage}] ${message}`;
}

export const logger = {
  info(stage: string, message: string, meta?: unknown): void {
    if (!shouldLog("info")) return;
    console.log(formatMessage("info", stage, message), meta ?? "");
  },

  warn(stage: string, message: string, meta?: unknown): void {
    if (!shouldLog("warn")) return;
    console.warn(formatMessage("warn", stage, message), meta ?? "");
  },

  error(stage: string, message: string, meta?: unknown): void {
    if (!shouldLog("error")) return;
    console.error(formatMessage("error", stage, message), meta ?? "");
  },

  debug(stage: string, message: string, meta?: unknown): void {
    if (!shouldLog("debug")) return;
    console.debug(formatMessage("debug", stage, message), meta ?? "");
  },
};
