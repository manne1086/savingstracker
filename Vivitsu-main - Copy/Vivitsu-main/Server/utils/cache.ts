import NodeCache from "node-cache";

/**
 * Cache utility for SavingsVault API
 * Uses node-cache with configurable TTL (default: 30 seconds)
 */

interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

class CacheManager {
  private cache: NodeCache;
  private defaultTTL: number = 30; // 30 seconds default

  constructor(defaultTTL: number = 30) {
    this.defaultTTL = defaultTTL;
    this.cache = new NodeCache({ stdTTL: defaultTTL });
  }

  /**
   * Get cached value or fetch fresh data
   * @param key Cache key
   * @param fetchFn Async function to fetch data if not cached
   * @param ttl Optional TTL override for this key
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = this.cache.get<T>(key);
    if (cached !== undefined) {
      console.log(`[Cache HIT] ${key}`);
      return cached;
    }

    // Cache miss - fetch fresh data
    console.log(`[Cache MISS] ${key} - fetching fresh data`);
    const data = await fetchFn();

    // Store in cache with optional TTL override
    this.cache.set(key, data, ttl || this.defaultTTL);
    return data;
  }

  /**
   * Set value directly in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value, ttl || this.defaultTTL);
  }

  /**
   * Invalidate a single key
   */
  invalidate(key: string): void {
    this.cache.del(key);
    console.log(`[Cache INVALIDATE] ${key}`);
  }

  /**
   * Invalidate all keys matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const keys = this.cache.keys();
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.del(key);
      }
    });
    console.log(`[Cache INVALIDATE PATTERN] ${pattern}`);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.flushAll();
    console.log(`[Cache CLEAR] All entries cleared`);
  }

  /**
   * Get cache stats
   */
  getStats() {
    return this.cache.getStats();
  }
}

// Singleton instance
export const cacheManager = new CacheManager(30);

// Cache key builders for consistency
export const cacheKeys = {
  vaultBalance: (address: string) => `vault:balance:${address.toLowerCase()}`,
  vaultHistory: (address: string, limit: number, offset: number) =>
    `vault:history:${address.toLowerCase()}:${limit}:${offset}`,
  vaultMilestones: (address: string) =>
    `vault:milestones:${address.toLowerCase()}`,
  leaderboard: (limit: number) => `vault:leaderboard:${limit}`,
  stats: () => `vault:stats`,
  txnVerify: (txnId: string) => `vault:txn:${txnId}`,
};
