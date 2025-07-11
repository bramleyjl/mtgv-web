import { cardSearchCache, generateSearchCacheKey, clearAllCaches } from './cache';

describe('Cache Service', () => {
  beforeEach(() => {
    clearAllCaches();
  });

  it('should set and get values', () => {
    const testData = { test: 'data' };
    cardSearchCache.set('test-key', testData);
    
    const result = cardSearchCache.get('test-key');
    expect(result).toEqual(testData);
  });

  it('should return null for non-existent keys', () => {
    const result = cardSearchCache.get('non-existent');
    expect(result).toBeNull();
  });

  it('should generate search cache keys correctly', () => {
    const key = generateSearchCacheKey('lightning bolt', true);
    expect(key).toBe('search:lightning bolt:true');
  });

  it('should clear all caches', () => {
    cardSearchCache.set('test-key', 'test-value');
    expect(cardSearchCache.getStats().keys).toBe(1);
    
    clearAllCaches();
    expect(cardSearchCache.getStats().keys).toBe(0);
  });
}); 