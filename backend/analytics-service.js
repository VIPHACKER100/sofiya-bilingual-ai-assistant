/**
 * SOFIYA Analytics Service
 * Phase 15.3: User engagement and feature usage tracking
 *
 * Tracks: voice commands by intent, WhatsApp volume, smart home scenes,
 * feature adoption rates. Data stored in Redis/DB for dashboard.
 */

const REDIS_PREFIX = 'sofiya:analytics';

export class AnalyticsService {
  constructor(options = {}) {
    this.redis = options.redis || null;
    this.pg = options.pg || null;
    this.inMemory = new Map(); // fallback when Redis unavailable
  }

  async initialize() {
    if (this.redis) {
      try {
        if (!this.redis.isOpen) await this.redis.connect();
      } catch (e) {
        console.warn('[AnalyticsService] Redis unavailable, using in-memory');
        this.redis = null;
      }
    }
  }

  async _incr(key, value = 1) {
    if (this.redis?.isOpen) {
      await this.redis.incrBy(key, value).catch(() => {});
    }
    const mem = this.inMemory.get(key) || 0;
    this.inMemory.set(key, mem + value);
  }

  async _hincr(key, field, value = 1) {
    if (this.redis?.isOpen) {
      await this.redis.hIncrBy(key, field, value).catch(() => {});
    }
    const mapKey = `${key}:${field}`;
    const mem = this.inMemory.get(mapKey) || 0;
    this.inMemory.set(mapKey, mem + value);
  }

  async _get(key) {
    if (this.redis?.isOpen) {
      const v = await this.redis.get(key).catch(() => null);
      if (v != null) return Number(v);
    }
    return Number(this.inMemory.get(key) || 0);
  }

  async _hgetall(key) {
    if (this.redis?.isOpen) {
      const h = await this.redis.hGetAll(key).catch(() => ({}));
      if (Object.keys(h).length) return h;
    }
    const prefix = key + ':';
    const out = {};
    for (const [k, v] of this.inMemory) {
      if (k.startsWith(prefix)) out[k.slice(prefix.length)] = String(v);
    }
    return out;
  }

  /**
   * Track voice command by intent
   */
  async trackVoiceCommand(userId, intent, success = true) {
    const now = new Date();
    const hourKey = `${REDIS_PREFIX}:voice:hour:${now.toISOString().slice(0, 13)}`;
    await this._hincr(`${REDIS_PREFIX}:voice:intent`, intent, 1);
    await this._hincr(hourKey, intent, 1);
    if (!success) await this._incr(`${REDIS_PREFIX}:voice:failed`, 1);
  }

  /**
   * Track WhatsApp message sent
   */
  async trackWhatsAppMessage(userId) {
    const now = new Date();
    const hourKey = `${REDIS_PREFIX}:whatsapp:hour:${now.toISOString().slice(0, 13)}`;
    await this._incr(`${REDIS_PREFIX}:whatsapp:total`, 1);
    await this._incr(hourKey, 1);
  }

  /**
   * Track smart home scene execution
   */
  async trackSceneExecuted(userId, sceneId) {
    await this._hincr(`${REDIS_PREFIX}:scenes`, sceneId, 1);
    await this._incr(`${REDIS_PREFIX}:scenes:total`, 1);
  }

  /**
   * Track feature adoption (e.g. reminders, calendar, health)
   */
  async trackFeatureUsed(userId, feature) {
    await this._hincr(`${REDIS_PREFIX}:features`, feature, 1);
    await this._hincr(`${REDIS_PREFIX}:users:${userId}:features`, feature, 1);
  }

  /**
   * Get analytics summary for dashboard
   */
  async getSummary(days = 7) {
    const intentCounts = await this._hgetall(`${REDIS_PREFIX}:voice:intent`);
    const sceneCounts = await this._hgetall(`${REDIS_PREFIX}:scenes`);
    const featureCounts = await this._hgetall(`${REDIS_PREFIX}:features`);

    return {
      voiceCommands: {
        byIntent: intentCounts,
        total: Object.values(intentCounts).reduce((a, b) => a + Number(b), 0)
      },
      whatsapp: { total: await this._get(`${REDIS_PREFIX}:whatsapp:total`) },
      scenes: {
        byScene: sceneCounts,
        total: Object.values(sceneCounts).reduce((a, b) => a + Number(b), 0)
      },
      features: featureCounts,
      period: `${days} days`
    };
  }
}

let singleton = null;

export function getAnalyticsService(options = {}) {
  if (!singleton) singleton = new AnalyticsService(options);
  return singleton;
}
