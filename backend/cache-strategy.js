/**
 * SOFIYA Cache Strategy
 * Phase 24.1: Intelligent Caching to Reduce Latency
 * 
 * Implements multi-layer caching with Redis and in-memory fallback.
 * Supports TTL, invalidation, and cache warming strategies.
 */

import 'dotenv/config';
import { createClient } from 'redis';

export class CacheStrategy {
    constructor(options = {}) {
        this.redis = null;
        this.memoryCache = new Map();
        this.useRedis = options.useRedis !== false;
        this.defaultTTL = options.defaultTTL || 3600; // 1 hour default
        
        // Cache configuration per data type
        this.cacheConfig = {
            weather: { ttl: 900, key: 'weather' }, // 15 minutes
            news: { ttl: 3600, key: 'news' }, // 1 hour
            calendar: { ttl: 1800, key: 'calendar' }, // 30 minutes
            userPreferences: { ttl: 86400, key: 'prefs', invalidation: 'on-change' }, // 24 hours
            smartHomeStatus: { ttl: 300, key: 'devices' }, // 5 minutes
            recommendations: { ttl: 86400, key: 'recommendations' }, // 24 hours
            nlpResults: { ttl: 3600, key: 'nlp' }, // 1 hour
            healthData: { ttl: 1800, key: 'health' } // 30 minutes
        };

        // Cache hit/miss statistics
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }

    /**
     * Initializes Redis connection
     */
    async initialize() {
        if (!this.useRedis) {
            console.log('[CacheStrategy] Using in-memory cache only');
            return;
        }

        try {
            this.redis = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('[CacheStrategy] Redis reconnection failed');
                            this.useRedis = false;
                            return new Error('Redis connection failed');
                        }
                        return Math.min(retries * 50, 1000);
                    }
                }
            });

            this.redis.on('error', (err) => {
                console.error('[CacheStrategy] Redis error:', err);
                this.useRedis = false;
            });

            await this.redis.connect();
            console.log('[CacheStrategy] Redis connected successfully');
        } catch (error) {
            console.warn('[CacheStrategy] Redis connection failed, using in-memory cache:', error.message);
            this.useRedis = false;
        }
    }

    /**
     * Gets value from cache
     * @param {string} key - Cache key
     * @param {string} type - Data type (for config lookup)
     * @returns {Promise<any|null>} Cached value or null
     */
    async get(key, type = null) {
        const cacheKey = this.buildKey(key, type);
        
        // Try Redis first
        if (this.useRedis && this.redis?.isOpen) {
            try {
                const value = await this.redis.get(cacheKey);
                if (value) {
                    this.stats.hits++;
                    return JSON.parse(value);
                }
            } catch (error) {
                console.error('[CacheStrategy] Redis get error:', error);
            }
        }

        // Fallback to memory cache
        const memoryEntry = this.memoryCache.get(cacheKey);
        if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
            this.stats.hits++;
            return memoryEntry.value;
        }

        // Clean up expired memory entry
        if (memoryEntry) {
            this.memoryCache.delete(cacheKey);
        }

        this.stats.misses++;
        return null;
    }

    /**
     * Sets value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {string} type - Data type (for config lookup)
     * @param {number} ttl - Optional TTL override (seconds)
     */
    async set(key, value, type = null, ttl = null) {
        const cacheKey = this.buildKey(key, type);
        const config = this.cacheConfig[type] || {};
        const cacheTTL = ttl || config.ttl || this.defaultTTL;

        // Set in Redis
        if (this.useRedis && this.redis?.isOpen) {
            try {
                await this.redis.setEx(cacheKey, cacheTTL, JSON.stringify(value));
                this.stats.sets++;
            } catch (error) {
                console.error('[CacheStrategy] Redis set error:', error);
            }
        }

        // Also set in memory cache
        this.memoryCache.set(cacheKey, {
            value,
            expiresAt: Date.now() + (cacheTTL * 1000)
        });

        this.stats.sets++;
    }

    /**
     * Gets value or fetches if not cached
     * @param {string} key - Cache key
     * @param {Function} fetcher - Function to fetch data if not cached
     * @param {string} type - Data type
     * @param {number} ttl - Optional TTL override
     * @returns {Promise<any>} Cached or fetched value
     */
    async getOrFetch(key, fetcher, type = null, ttl = null) {
        const cached = await this.get(key, type);
        if (cached !== null) {
            return cached;
        }

        // Fetch and cache
        const value = await fetcher();
        await this.set(key, value, type, ttl);
        return value;
    }

    /**
     * Invalidates cache entry
     * @param {string} key - Cache key
     * @param {string} type - Data type
     */
    async invalidate(key, type = null) {
        const cacheKey = this.buildKey(key, type);

        // Delete from Redis
        if (this.useRedis && this.redis?.isOpen) {
            try {
                await this.redis.del(cacheKey);
                this.stats.deletes++;
            } catch (error) {
                console.error('[CacheStrategy] Redis delete error:', error);
            }
        }

        // Delete from memory cache
        this.memoryCache.delete(cacheKey);
        this.stats.deletes++;
    }

    /**
     * Invalidates all cache entries matching pattern
     * @param {string} pattern - Redis pattern (e.g., 'weather:*')
     */
    async invalidatePattern(pattern) {
        if (this.useRedis && this.redis?.isOpen) {
            try {
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0) {
                    await this.redis.del(keys);
                    this.stats.deletes += keys.length;
                }
            } catch (error) {
                console.error('[CacheStrategy] Pattern invalidation error:', error);
            }
        }

        // Also clear from memory cache
        for (const [key] of this.memoryCache.entries()) {
            if (key.includes(pattern.replace('*', ''))) {
                this.memoryCache.delete(key);
            }
        }
    }

    /**
     * Warms cache with frequently accessed data
     * @param {Array} items - Array of {key, fetcher, type} objects
     */
    async warmCache(items) {
        console.log(`[CacheStrategy] Warming cache with ${items.length} items`);
        
        const promises = items.map(async ({ key, fetcher, type }) => {
            try {
                const value = await fetcher();
                await this.set(key, value, type);
            } catch (error) {
                console.error(`[CacheStrategy] Error warming cache for ${key}:`, error);
            }
        });

        await Promise.all(promises);
        console.log('[CacheStrategy] Cache warming complete');
    }

    /**
     * Gets cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;

        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            memoryCacheSize: this.memoryCache.size,
            redisConnected: this.useRedis && this.redis?.isOpen
        };
    }

    /**
     * Clears all cache
     */
    async clear() {
        if (this.useRedis && this.redis?.isOpen) {
            try {
                await this.redis.flushDb();
            } catch (error) {
                console.error('[CacheStrategy] Redis flush error:', error);
            }
        }

        this.memoryCache.clear();
        console.log('[CacheStrategy] Cache cleared');
    }

    /**
     * Builds cache key with prefix
     * @private
     */
    buildKey(key, type) {
        const prefix = type && this.cacheConfig[type] 
            ? this.cacheConfig[type].key 
            : 'cache';
        return `${prefix}:${key}`;
    }

    /**
     * Cleans up expired memory cache entries
     */
    cleanupMemoryCache() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.expiresAt <= now) {
                this.memoryCache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`[CacheStrategy] Cleaned up ${cleaned} expired memory cache entries`);
        }
    }

    /**
     * Starts periodic cleanup
     */
    startCleanup(intervalMs = 60000) {
        setInterval(() => {
            this.cleanupMemoryCache();
        }, intervalMs);
    }

    /**
     * Closes Redis connection
     */
    async close() {
        if (this.redis?.isOpen) {
            await this.redis.quit();
            this.redis = null;
        }
        this.memoryCache.clear();
        console.log('[CacheStrategy] Closed');
    }
}

// Example usage:
// const cache = new CacheStrategy();
// await cache.initialize();
// const weather = await cache.getOrFetch('nyc', () => fetchWeather('NYC'), 'weather');
// await cache.invalidate('nyc', 'weather');
