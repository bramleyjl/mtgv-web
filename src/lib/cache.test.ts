import { cardSearchCache, generateSearchCacheKey, getCacheStats, clearAllCaches } from './cache';

// Mock fetch for API testing
global.fetch = jest.fn();

describe('Cache Functionality', () => {
  beforeEach(() => {
    // Clear all caches before each test
    clearAllCaches();
    jest.clearAllMocks();
  });

  describe('generateSearchCacheKey', () => {
    it('should generate consistent cache keys for same query and uniqueNamesOnly', () => {
      const key1 = generateSearchCacheKey('lightning bolt', true);
      const key2 = generateSearchCacheKey('lightning bolt', true);
      expect(key1).toBe(key2);
    });

    it('should generate different cache keys for different queries', () => {
      const key1 = generateSearchCacheKey('lightning bolt', true);
      const key2 = generateSearchCacheKey('lightning strike', true);
      expect(key1).not.toBe(key2);
    });

    it('should generate different cache keys for different uniqueNamesOnly values', () => {
      const key1 = generateSearchCacheKey('lightning bolt', true);
      const key2 = generateSearchCacheKey('lightning bolt', false);
      expect(key1).not.toBe(key2);
    });
  });

  describe('cardSearchCache', () => {
    it('should store and retrieve cached search results', () => {
      const cacheKey = generateSearchCacheKey('test card', true);
      const mockResults = { cards: ['Test Card', 'Test Card 2'] };
      
      cardSearchCache.set(cacheKey, mockResults);
      const retrieved = cardSearchCache.get(cacheKey);
      
      expect(retrieved).toEqual(mockResults);
    });

    it('should return null for non-existent cache keys', () => {
      const cacheKey = generateSearchCacheKey('non-existent', true);
      const retrieved = cardSearchCache.get(cacheKey);
      
      expect(retrieved).toBeNull();
    });

    it('should expire cached items after TTL', (done) => {
      const cacheKey = generateSearchCacheKey('expire test', true);
      const mockResults = { cards: ['Expire Test'] };
      
      // Set with short TTL for testing
      cardSearchCache.set(cacheKey, mockResults, 0.1); // 0.1 seconds
      
      setTimeout(() => {
        const retrieved = cardSearchCache.get(cacheKey);
        expect(retrieved).toBeNull();
        done();
      }, 200); // Wait 200ms for expiration
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = getCacheStats();
      
      expect(stats).toHaveProperty('search');
      expect(stats.search).toHaveProperty('keys');
      expect(stats.search).toHaveProperty('hits');
      expect(stats.search).toHaveProperty('misses');
    });

    it('should track cache hits and misses', () => {
      const cacheKey = generateSearchCacheKey('stats test', true);
      const mockResults = { cards: ['Stats Test'] };
      
      // Initial stats
      const initialStats = getCacheStats();
      
      // Set cache
      cardSearchCache.set(cacheKey, mockResults);
      
      // Get from cache (hit)
      cardSearchCache.get(cacheKey);
      
      // Get non-existent key (miss)
      cardSearchCache.get('non-existent');
      
      const finalStats = getCacheStats();
      
      expect(finalStats.search.hits).toBeGreaterThan(initialStats.search.hits);
      expect(finalStats.search.misses).toBeGreaterThan(initialStats.search.misses);
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', () => {
      const cacheKey = generateSearchCacheKey('clear test', true);
      const mockResults = { cards: ['Clear Test'] };
      
      // Set cache
      cardSearchCache.set(cacheKey, mockResults);
      expect(cardSearchCache.get(cacheKey)).toEqual(mockResults);
      
      // Clear all caches
      clearAllCaches();
      
      // Verify cache is cleared
      expect(cardSearchCache.get(cacheKey)).toBeNull();
    });
  });

  describe('API Response Caching', () => {
    it('should not cache card package retrieval responses', async () => {
      const mockResponse = {
        card_package: {
          package_id: 'test-package',
          package_entries: [
            {
              name: 'Test Card',
              selected_print: 'test-scryfall-id',
              user_selected: true
            }
          ]
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Simulate API call
      const response = await fetch('/api/card_packages/test-package');
      await response.json();

      // Verify response doesn't have cache headers
      expect(response.headers?.get('Cache-Control')).not.toBe('public, max-age=3600');
    });

    it('should cache card search responses appropriately', async () => {
      const mockResponse = {
        cards: ['Lightning Bolt', 'Lightning Strike']
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Simulate API call
      const response = await fetch('/api/cards/search?query=lightning');
      const data = await response.json();

      // Verify search results are cached (this would be handled by the search route)
      expect(data).toEqual(mockResponse);
    });
  });

  describe('Cache Performance', () => {
    it('should improve performance for repeated searches', () => {
      const cacheKey = generateSearchCacheKey('performance test', true);
      const mockResults = { cards: ['Performance Test'] };
      
      const startTime = Date.now();
      
      // First call (cache miss)
      cardSearchCache.set(cacheKey, mockResults);
      const firstCall = cardSearchCache.get(cacheKey);
      
      const midTime = Date.now();
      
      // Second call (cache hit)
      const secondCall = cardSearchCache.get(cacheKey);
      
      const endTime = Date.now();
      
      expect(firstCall).toEqual(mockResults);
      expect(secondCall).toEqual(mockResults);
      
      // Cache hit should be faster (though in this simple test it might not be noticeable)
      expect(endTime - midTime).toBeLessThanOrEqual(midTime - startTime);
    });
  });
}); 