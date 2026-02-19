/**
 * SOFIYA Structured Logger
 * Phase 15.1: Structured logging with Winston
 *
 * Log levels: ERROR, WARN, INFO, DEBUG
 * Logs: API requests, voice commands, integration errors, user actions
 */

import winston from 'winston';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const { combine, timestamp, json, printf, colorize } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${ts} [${level}] ${message} ${metaStr}`;
});

const transports = [];

// Console output
transports.push(
  new winston.transports.Console({
    format:
      process.env.NODE_ENV === 'production'
        ? combine(timestamp(), json())
        : combine(timestamp(), colorize(), devFormat)
  })
);

// Optional: log to file in production
if (process.env.LOG_FILE) {
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE,
      format: combine(timestamp(), json())
    })
  );
}

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'sofiya-backend' },
  transports
});

/**
 * Log API request (for middleware)
 */
export function logRequest(req, res, durationMs) {
  logger.info('API request', {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    durationMs: Math.round(durationMs),
    userId: req.user?.id || 'anonymous'
  });
}

/**
 * Log voice command processing
 */
export function logVoiceCommand(command, intent, confidence, success, latencyMs) {
  logger.info('Voice command', {
    command: command?.substring(0, 100),
    intent,
    confidence,
    success,
    latencyMs
  });
}

/**
 * Log integration operation (WhatsApp, smart home, calendar, etc.)
 */
export function logIntegration(service, operation, success, error = null) {
  const level = success ? 'info' : 'error';
  logger[level]('Integration operation', {
    service,
    operation,
    success,
    error: error?.message || null
  });
}

/**
 * Log user action (for analytics/audit)
 */
export function logUserAction(userId, action, details = {}) {
  logger.info('User action', { userId, action, ...details });
}

/**
 * Error logging with full context
 */
export function logError(message, error, context = {}) {
  logger.error(message, {
    error: error?.message,
    stack: error?.stack,
    ...context
  });
}

export default logger;
