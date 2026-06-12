/**
 * Simple in-memory cache for stock ticker data
 * Stores analysis results with TTL to avoid excessive API calls
 */

const cache = new Map();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function getCacheKey(ticker, period, interval) {
  return `${ticker}:${period}:${interval}`;
}

export function getCachedAnalysis(ticker, period, interval) {
  const key = getCacheKey(ticker, period, interval);
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

export function setCachedAnalysis(ticker, period, interval, data, ttl = DEFAULT_TTL) {
  const key = getCacheKey(ticker, period, interval);
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

export function clearCache() {
  cache.clear();
}

export function clearExpiredCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
    }
  }
}

export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  };
}
