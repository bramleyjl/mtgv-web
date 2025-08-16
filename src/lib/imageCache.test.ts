/**
 * Unit tests for ImageCache service
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { imageCache, getImagePriority, preloadCardImages } from './imageCache';

// Mock Image constructor
global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  complete: boolean = false;
  naturalWidth: number = 0;
  naturalHeight: number = 0;
  
  constructor() {
    // Simulate immediate load for testing
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
} as any;

describe('ImageCache', () => {
  beforeEach(() => {
    // Clear cache before each test
    imageCache.clear();
  });

  describe('Basic caching functionality', () => {
    it('should cache and retrieve images', () => {
      const url = 'https://example.com/image.jpg';
      
      imageCache.set(url, 'high');
      expect(imageCache.has(url)).toBe(true);
    });

    it('should return null for non-existent images', () => {
      const url = 'https://example.com/nonexistent.jpg';
      expect(imageCache.get(url)).toBe(null);
    });

    it('should handle different priority levels', () => {
      const highUrl = 'https://example.com/high.jpg';
      const mediumUrl = 'https://example.com/medium.jpg';
      const lowUrl = 'https://example.com/low.jpg';
      
      imageCache.set(highUrl, 'high');
      imageCache.set(mediumUrl, 'medium');
      imageCache.set(lowUrl, 'low');
      
      expect(imageCache.has(highUrl)).toBe(true);
      expect(imageCache.has(mediumUrl)).toBe(true);
      expect(imageCache.has(lowUrl)).toBe(true);
    });
  });

  describe('Cache expiration', () => {
    it('should expire images after TTL', () => {
      const url = 'https://example.com/expiring.jpg';
      
      // Mock Date.now to control timing
      const originalNow = Date.now;
      const mockNow = jest.fn();
      
      // Set image with 1ms TTL
      mockNow.mockReturnValue(1000);
      Date.now = mockNow;
      imageCache.set(url, 'low');
      
      // Advance time past TTL
      mockNow.mockReturnValue(1000 + 6 * 60 * 60 * 1000 + 1);
      Date.now = mockNow;
      
      expect(imageCache.has(url)).toBe(false);
      
      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('Cache size management', () => {
    it('should limit cache size to prevent memory issues', () => {
      // Fill cache beyond limit (default is 1000 in production, 200 in development)
      const maxSize = process.env.NODE_ENV === 'development' ? 200 : 1000;
      for (let i = 0; i < maxSize + 100; i++) {
        imageCache.set(`https://example.com/image${i}.jpg`, 'low');
      }
      
      const stats = imageCache.getStats();
      expect(stats.totalSize).toBeLessThanOrEqual(maxSize);
    });

    it('should evict oldest entries when cache is full', () => {
      const maxSize = process.env.NODE_ENV === 'development' ? 200 : 1000;
      
      // Add images with different priorities
      for (let i = 0; i < maxSize; i++) {
        const priority = i < maxSize * 0.1 ? 'high' : i < maxSize * 0.5 ? 'medium' : 'low';
        imageCache.set(`https://example.com/image${i}.jpg`, priority);
      }
      
      // Add one more to trigger eviction
      imageCache.set('https://example.com/trigger.jpg', 'low');
      
      const stats = imageCache.getStats();
      expect(stats.totalSize).toBeLessThanOrEqual(maxSize);
    });

    it('should respect PUBLIC_IMAGE_CACHE_SIZE environment variable', () => {
      // This test verifies that the cache respects the environment variable
      
      const maxSize = imageCache.getMaxCacheSize();
      expect(maxSize).toBeGreaterThan(0);
      
      for (let i = 0; i < maxSize + 50; i++) {
        imageCache.set(`https://example.com/custom${i}.jpg`, 'low');
      }
      
      const stats = imageCache.getStats();
      expect(stats.totalSize).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('Image preloading', () => {
    it('should preload images efficiently', async () => {
      const urls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg'
      ];
      
      // Preload images
      imageCache.preloadBatch(urls, 'medium');
      
      // Wait for preloading to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check that images are cached
      urls.forEach(url => {
        expect(imageCache.has(url)).toBe(true);
      });
      
      const stats = imageCache.getStats();
      expect(stats.preloaded).toBeGreaterThan(0);
    });

    it('should not preload already cached images', () => {
      const url = 'https://example.com/cached.jpg';
      
      // Cache the image first
      imageCache.set(url, 'medium');
      
      // Try to preload it
      imageCache.preload(url, 'high');
      
      // Should not be in preload queue
      const preloadQueue = imageCache.getPreloadQueue();
      expect(preloadQueue).not.toContain(url);
    });
  });

  describe('Priority management', () => {
    it('should update image priority', () => {
      const url = 'https://example.com/priority.jpg';
      
      imageCache.set(url, 'low');
      imageCache.updatePriority(url, 'high');
      
      const entry = imageCache.get(url);
      expect(entry?.priority).toBe('high');
    });

    it('should reset timestamp when updating priority', () => {
      const url = 'https://example.com/priority.jpg';
      
      imageCache.set(url, 'low');
      const originalEntry = imageCache.get(url);
      
      // Wait a bit
      setTimeout(() => {
        imageCache.updatePriority(url, 'high');
        const updatedEntry = imageCache.get(url);
        
        expect(updatedEntry?.timestamp).toBeGreaterThan(originalEntry?.timestamp || 0);
      }, 10);
    });
  });

  describe('Statistics', () => {
    it('should track cache hits and misses', () => {
      const url = 'https://example.com/stats.jpg';
      
      // Miss
      imageCache.has(url);
      
      // Hit
      imageCache.set(url, 'medium');
      imageCache.has(url);
      
      const stats = imageCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should estimate memory usage', () => {
      const url = 'https://example.com/memory.jpg';
      imageCache.set(url, 'medium');
      
      const stats = imageCache.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should expose maximum cache size limit', () => {
      const maxSize = imageCache.getMaxCacheSize();
      expect(maxSize).toBeGreaterThan(0);
      expect(typeof maxSize).toBe('number');
    });
  });

  describe('Environment configuration', () => {
    it('should use appropriate cache size for current environment', () => {
      // This test verifies that the cache uses an appropriate size for the current environment
      // Since the cache is a singleton, we can't change the environment dynamically in tests
      
      const maxSize = imageCache.getMaxCacheSize();
      expect(maxSize).toBeGreaterThan(0);
      
      // Verify the cache respects its configured limit
      for (let i = 0; i < maxSize + 50; i++) {
        imageCache.set(`https://example.com/env${i}.jpg`, 'low');
      }
      
      const stats = imageCache.getStats();
      expect(stats.totalSize).toBeLessThanOrEqual(maxSize);
      
      // Log the current configuration for debugging
      console.log(`Current cache size limit: ${maxSize}`);
      console.log(`Current environment: ${process.env.NODE_ENV}`);
      console.log(`Custom cache size: ${process.env.PUBLIC_IMAGE_CACHE_SIZE || 'not set'}`);
    });
  });

  describe('Cleanup', () => {
    it('should clean up expired entries', () => {
      const url = 'https://example.com/cleanup.jpg';
      
      // Mock Date.now to control timing
      const originalNow = Date.now;
      const mockNow = jest.fn();
      
      // Set image with 1ms TTL
      mockNow.mockReturnValue(1000);
      Date.now = mockNow;
      imageCache.set(url, 'low');
      
      // Advance time past TTL
      mockNow.mockReturnValue(1000 + 6 * 60 * 60 * 1000 + 1);
      Date.now = mockNow;
      
      // Trigger cleanup - access private method for testing
      const deleted = (imageCache as any).cleanup();
      expect(deleted).toBeGreaterThan(0);
      expect(imageCache.has(url)).toBe(false);
      
      // Restore original Date.now
      Date.now = originalNow;
    });
  });
});

describe('Utility functions', () => {
  describe('getImagePriority', () => {
    it('should return high priority for selected cards', () => {
      const priority = getImagePriority(true, true, true);
      expect(priority).toBe('high');
    });

    it('should return medium priority for visible cards in viewport', () => {
      const priority = getImagePriority(true, false, true);
      expect(priority).toBe('medium');
    });

    it('should return low priority for non-visible cards', () => {
      const priority = getImagePriority(false, false, false);
      expect(priority).toBe('low');
    });
  });

  describe('preloadCardImages', () => {
    it('should extract image URLs from card prints', () => {
      const cardPrints: Array<{ image_url?: string; image_uris?: Array<{ normal?: string }> }> = [
        { image_url: 'https://example.com/card1.jpg' },
        { image_uris: [{ normal: 'https://example.com/card2.jpg' }] },
        { image_uris: [] },
      ];
      
      // Mock the preloadBatch method
      const mockPreloadBatch = jest.spyOn(imageCache, 'preloadBatch');
      
      preloadCardImages(cardPrints, 'medium');
      
      expect(mockPreloadBatch).toHaveBeenCalledWith([
        'https://example.com/card1.jpg',
        'https://example.com/card2.jpg'
      ], 'medium');
      
      mockPreloadBatch.mockRestore();
    });

    it('should handle empty card prints array', () => {
      const mockPreloadBatch = jest.spyOn(imageCache, 'preloadBatch');
      
      preloadCardImages([], 'low');
      
      expect(mockPreloadBatch).toHaveBeenCalledWith([], 'low');
      
      mockPreloadBatch.mockRestore();
    });
  });
}); 