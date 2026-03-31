import NodeCache from "node-cache";

/**
 * Caching layer for SavingsVault API
 * Uses node-cache with configurable TTL per key
 */

const defaultConfig = {
  stdTTL: 30, // 30 seconds default
  checkperiod: 60, // check every 60 seconds
};

export const cache = new NodeCache(defaultConfig);

/**
 * Get cached value or fetch fresh data
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data if not cached
 * @param {number} ttl - Time to live in seconds (optional, uses default if not specified)
 * @returns {Promise} Cached or fresh data
 */
export const getCached = async (key, fetchFn, ttl = 30) => {
  // Check cache first
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache with TTL
  cache.set(key, data, ttl);

  return data;
};

/**
 * Invalidate cache key
 */
export const invalidateCache = (key) => {
  cache.del(key);
};

/**
 * Invalidate all cache keys matching a pattern
 */
export const invalidateCachePattern = (pattern) => {
  const keys = cache.keys();
  const regex = new RegExp(pattern);
  keys.forEach((key) => {
    if (regex.test(key)) {
      cache.del(key);
    }
  });
};

/**
 * Get cache key for vault balance
 */
export const getCacheKeyVaultBalance = (address) => {
  return `vault:balance:${address}`;
};

/**
 * Get cache key for vault history
 */
export const getCacheKeyVaultHistory = (address, limit, offset) => {
  return `vault:history:${address}:${limit}:${offset}`;
};

/**
 * Get cache key for milestones
 */
export const getCacheKeyMilestones = (address) => {
  return `vault:milestones:${address}`;
};

/**
 * Get cache key for leaderboard
 */
export const getCacheKeyLeaderboard = (limit) => {
  return `vault:leaderboard:${limit}`;
};

/**
 * Get cache key for stats
 */
export const getCacheKeyStats = () => {
  return "vault:stats";
};
