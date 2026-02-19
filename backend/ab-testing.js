/**
 * SOFIYA A/B Testing Framework
 * Phase 16.2: Assign users to variants, track outcomes, statistical significance
 */

const assignments = new Map(); // userId -> { experimentId -> variant }
const events = [];

/**
 * Get or assign variant for user
 * @param {string} userId - User ID
 * @param {string} experimentId - Experiment identifier
 * @param {string[]} variants - e.g. ['control', 'treatment']
 * @returns {string} Assigned variant
 */
export function getVariant(userId, experimentId, variants = ['control', 'treatment']) {
  const key = `${userId}:${experimentId}`;
  if (assignments.has(key)) return assignments.get(key);

  const idx = hashUserId(userId, experimentId) % variants.length;
  const variant = variants[idx];
  assignments.set(key, variant);
  return variant;
}

function hashUserId(userId, seed) {
  let h = 0;
  const s = `${userId}:${seed}`;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Track outcome event for A/B analysis
 * @param {string} userId
 * @param {string} experimentId
 * @param {string} variant
 * @param {string} eventType - e.g. 'engagement', 'conversion', 'satisfaction'
 * @param {Object} metadata - Optional extra data
 */
export function trackEvent(userId, experimentId, variant, eventType, metadata = {}) {
  events.push({
    userId,
    experimentId,
    variant,
    eventType,
    metadata,
    timestamp: Date.now()
  });
}

/**
 * Get experiment stats (simple counts per variant)
 */
export function getExperimentStats(experimentId) {
  const byVariant = {};
  for (const e of events) {
    if (e.experimentId !== experimentId) continue;
    const k = e.variant;
    if (!byVariant[k]) byVariant[k] = { total: 0, byEvent: {} };
    byVariant[k].total++;
    byVariant[k].byEvent[e.eventType] = (byVariant[k].byEvent[e.eventType] || 0) + 1;
  }
  return byVariant;
}
