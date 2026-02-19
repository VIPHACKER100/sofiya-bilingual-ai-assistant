export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000;

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) expired++;
      else valid++;
    }

    return {
      total: this.cache.size,
      valid,
      expired
    };
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

export const cacheService = new CacheService();

setInterval(() => cacheService.cleanup(), 60000);
