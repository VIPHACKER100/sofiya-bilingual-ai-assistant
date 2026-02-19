/**
 * SOFIYA Error Tracker
 * Phase 15.4: Sentry integration for error capture and analysis
 *
 * Auto-reports exceptions with stack traces. Groups similar errors.
 * Gracefully no-ops when SENTRY_DSN is not set.
 */

let sentry = null;
let initialized = false;

export async function initErrorTracker() {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn || dsn === 'your-sentry-dsn-optional') return;

  try {
    sentry = await import('@sentry/node');
    sentry.Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
      maxBreadcrumbs: 50
    });
    console.log('[ErrorTracker] Sentry initialized');
  } catch (e) {
    console.warn('[ErrorTracker] Sentry init failed:', e?.message);
  }
}

export function captureException(error, context = {}) {
  if (!sentry?.Sentry) return;
  try {
    sentry.Sentry.withScope((scope) => {
      Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
      sentry.Sentry.captureException(error);
    });
  } catch (_) {}
}

export function captureMessage(message, level = 'error') {
  if (!sentry?.Sentry) return;
  try {
    sentry.Sentry.captureMessage(message, level);
  } catch (_) {}
}

export function setUser(user) {
  if (!sentry?.Sentry) return;
  try {
    sentry.Sentry.setUser(user ? { id: user.id, email: user.email } : null);
  } catch (_) {}
}
