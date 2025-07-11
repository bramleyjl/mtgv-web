interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  size: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor(private defaultTTL: number = 30 * 60 * 1000) {} // 30 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
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
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: this.cache.size,
      size: this.cache.size,
    };
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now();
    let deleted = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }
}

// Create singleton instance for card search caching
export const cardSearchCache = new Cache(15 * 60 * 1000); // 15 minutes for search results

// Cache key generators
export function generateSearchCacheKey(query: string, uniqueNamesOnly: boolean = true): string {
  return `search:${query.toLowerCase()}:${uniqueNamesOnly}`;
}

// Cache management utilities
export function clearAllCaches(): void {
  cardSearchCache.clear();
}

export function getCacheStats() {
  return {
    search: cardSearchCache.getStats(),
  };
}

// Periodic cleanup
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setInterval(() => {
    cardSearchCache.cleanup();
  }, 5 * 60 * 1000); // Clean up every 5 minutes
} 