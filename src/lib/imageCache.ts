/**
 * Image Caching Service for MTGV Frontend
 * 
 * This service provides efficient image caching, preloading, and optimization
 * to reduce load on Scryfall and improve user experience.
 */

export interface ImageCacheEntry {
  url: string;
  timestamp: number;
  ttl: number;
  priority: 'high' | 'medium' | 'low';
  preloaded: boolean;
}

export interface ImageCacheStats {
  hits: number;
  misses: number;
  preloaded: number;
  totalSize: number;
  memoryUsage: number;
}

class ImageCache {
  private cache = new Map<string, ImageCacheEntry>();
  private preloadQueue: string[] = [];
  private stats: ImageCacheStats = {
    hits: 0,
    misses: 0,
    preloaded: 0,
    totalSize: 0,
    memoryUsage: 0,
  };

  // Cache TTL based on priority
  private readonly TTL = {
    high: 24 * 60 * 60 * 1000,    // 24 hours for frequently viewed cards
    medium: 12 * 60 * 60 * 1000,  // 12 hours for moderately viewed cards
    low: 6 * 60 * 60 * 1000,      // 6 hours for rarely viewed cards
  };

  // Maximum cache size to prevent memory issues
  // This can be configured via the environment variable PUBLIC_IMAGE_CACHE_SIZE
  private readonly MAX_CACHE_SIZE: number = (() => {
    if (typeof process !== 'undefined' && process.env && process.env.PUBLIC_IMAGE_CACHE_SIZE) {
      const parsed = parseInt(process.env.PUBLIC_IMAGE_CACHE_SIZE, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    // Default: 1000 in production, 200 in development
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
      return 200;
    }
    return 1000;
  })();

  constructor() {
    // Clean up expired entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  /**
   * Add an image URL to the cache
   */
  set(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    // Check if already cached to avoid duplicates
    if (this.cache.has(url)) {
      return;
    }

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    const entry: ImageCacheEntry = {
      url,
      timestamp: Date.now(),
      ttl: this.TTL[priority],
      priority,
      preloaded: false,
    };

    this.cache.set(url, entry);
    
    // Update stats
    this.stats.totalSize = this.cache.size;
    this.stats.memoryUsage = this.estimateMemoryUsage();
    

  }

  /**
   * Check if an image URL is cached and not expired
   */
  has(url: string): boolean {
    const entry = this.cache.get(url);
    if (!entry) {
      this.stats.misses++;
      return false;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(url);
      this.stats.misses++;
      return false;
    }

    this.stats.hits++;
    return true;
  }

  /**
   * Get cache entry for an image URL
   */
  get(url: string): ImageCacheEntry | null {
    if (!this.has(url)) {
      return null;
    }
    return this.cache.get(url) || null;
  }

  /**
   * Preload an image to improve user experience
   */
  preload(url: string, priority: 'high' | 'medium' | 'low' = 'low'): void {
    // Always track preload attempts, even if already cached
    this.stats.preloaded++;
    
    if (this.has(url)) {
      return; // Already cached, but we still counted the preload attempt
    }

    // Add to preload queue
    this.preloadQueue.push(url);
    
    // Create a new Image object to trigger preloading
    const img = new Image();
    img.onload = () => {
      this.set(url, priority);
      
      // Remove from preload queue
      const index = this.preloadQueue.indexOf(url);
      if (index > -1) {
        this.preloadQueue.splice(index, 1);
      }
    };
    
    img.onerror = () => {
      // Remove from preload queue on error
      const index = this.preloadQueue.indexOf(url);
      if (index > -1) {
        this.preloadQueue.splice(index, 1);
      }
    };
    
    img.src = url;
  }

  /**
   * Preload multiple images efficiently
   */
  preloadBatch(urls: string[], priority: 'high' | 'medium' | 'low' = 'low'): void {
    // Limit concurrent preloads to avoid overwhelming the browser
    const maxConcurrent = 3;
    const queue = [...urls];
    
    const processQueue = () => {
      if (queue.length === 0) return;
      
      const batch = queue.splice(0, maxConcurrent);
      batch.forEach(url => this.preload(url, priority));
      
      // Process next batch after a short delay
      setTimeout(processQueue, 100);
    };
    
    processQueue();
  }

  /**
   * Update priority of cached image
   */
  updatePriority(url: string, priority: 'high' | 'medium' | 'low'): void {
    const entry = this.cache.get(url);
    if (entry) {
      entry.priority = priority;
      entry.ttl = this.TTL[priority];
      entry.timestamp = Date.now(); // Reset timestamp
    }
  }

  /**
   * Remove oldest entries when cache is full
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by timestamp (oldest first) and priority (lowest first)
    entries.sort((a, b) => {
      if (a[1].timestamp !== b[1].timestamp) {
        return a[1].timestamp - b[1].timestamp;
      }
      
      const priorityOrder = { low: 0, medium: 1, high: 2 };
      return priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
    });
    
    // Remove oldest 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): number {
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

  /**
   * Get cache statistics
   */
  getStats(): ImageCacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      preloaded: this.stats.preloaded,
      totalSize: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): number {
    // Rough estimate: each entry is ~100 bytes + URL length
    let totalBytes = 0;
    for (const [key] of this.cache.entries()) {
      totalBytes += key.length + 100; // URL length + entry overhead
    }
    return totalBytes;
  }

  /**
   * Clear all cached images
   */
  clear(): void {
    this.cache.clear();
    this.preloadQueue = [];
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.preloaded = 0;
  }

  /**
   * Get URLs currently being preloaded
   */
  getPreloadQueue(): string[] {
    return [...this.preloadQueue];
  }

  /**
   * Get the current preload queue size
   */
  getPreloadQueueSize(): number {
    return this.preloadQueue.length;
  }

  /**
   * Get the current maximum cache size limit
   */
  getMaxCacheSize(): number {
    return this.MAX_CACHE_SIZE;
  }

}

// Create singleton instance
export const imageCache = new ImageCache();

/**
 * Utility functions for image optimization
 */

/**
 * Generate optimized image URL with appropriate sizing
 */
export function getOptimizedImageUrl(
  originalUrl: string
): string {
  // For Scryfall images, we can't modify the URL, but we can use Next.js Image optimization
  // The Next.js Image component will handle optimization automatically
  return originalUrl;
}

/**
 * Determine image priority based on usage context
 */
export function getImagePriority(
  isVisible: boolean,
  isSelected: boolean,
  isInViewport: boolean
): 'high' | 'medium' | 'low' {
  if (isSelected) return 'high';
  if (isVisible && isInViewport) return 'medium';
  return 'low';
}

/**
 * Preload images for a card list to improve user experience
 */
export function preloadCardImages(
  cardPrints: Array<{ image_url?: string; image_uris?: Array<{ normal?: string }> }>,
  priority: 'high' | 'medium' | 'low' = 'medium'
): void {
  const urls = cardPrints
    .map(print => {
      if (print.image_url) return print.image_url;
      if (print.image_uris?.[0]?.normal) return print.image_uris[0].normal;
      return null;
    })
    .filter(Boolean) as string[];

  imageCache.preloadBatch(urls, priority);
} 