# Image Caching Service Documentation

## Overview

The Image Caching Service provides efficient image caching, preloading, and optimization for the MTGV frontend. It's designed to reduce load on Scryfall's servers while improving user experience through intelligent caching strategies.

## Features

- **Intelligent Caching**: Multi-tier priority system with configurable TTL
- **Image Preloading**: Background preloading of images for better UX
- **Memory Management**: Automatic cache size limiting and cleanup
- **Environment Configuration**: Configurable cache sizes for different environments
- **Performance Monitoring**: Built-in statistics and memory usage tracking

## Configuration

### Environment Variables

#### `PUBLIC_IMAGE_CACHE_SIZE`
Controls the maximum number of images that can be cached in memory.

**Default Values:**
- **Development**: 200 entries
- **Production**: 1000 entries

**Example:**
```bash
# Set custom cache size
NEXT_PUBLIC_IMAGE_CACHE_SIZE=500

# In .env.local file
PUBLIC_IMAGE_CACHE_SIZE=500
```

**Priority Order:**
1. `PUBLIC_IMAGE_CACHE_SIZE` environment variable (if set)
2. Development mode: 200 entries
3. Production mode: 1000 entries

### Cache TTL (Time To Live)

Images are cached with different TTL values based on priority:

- **High Priority**: 24 hours (frequently viewed cards)
- **Medium Priority**: 12 hours (moderately viewed cards)  
- **Low Priority**: 6 hours (rarely viewed cards)

## API Reference

### Core Methods

#### `imageCache.set(url: string, priority: 'high' | 'medium' | 'low'): void`
Adds an image URL to the cache with specified priority.

```typescript
import { imageCache } from '@/lib/imageCache';

// Cache a frequently viewed card image
imageCache.set('https://cards.scryfall.io/card.jpg', 'high');
```

#### `imageCache.has(url: string): boolean`
Checks if an image URL is cached and not expired.

```typescript
if (imageCache.has(imageUrl)) {
  // Image is cached and ready to use
}
```

#### `imageCache.get(url: string): ImageCacheEntry | null`
Retrieves cache entry for an image URL.

```typescript
const entry = imageCache.get(imageUrl);
if (entry) {
  console.log(`Image cached at ${new Date(entry.timestamp)}`);
}
```

#### `imageCache.preload(url: string, priority?: 'high' | 'medium' | 'low'): void`
Preloads an image in the background to improve user experience.

```typescript
// Preload card images when user hovers over card names
imageCache.preload(cardImageUrl, 'medium');
```

#### `imageCache.preloadBatch(urls: string[], priority?: 'high' | 'medium' | 'low'): void`
Efficiently preloads multiple images with controlled concurrency.

```typescript
const cardImages = cardPrints.map(print => print.image_url).filter(Boolean);
imageCache.preloadBatch(cardImages, 'medium');
```

### Utility Functions

#### `getImagePriority(isVisible: boolean, isSelected: boolean, isInViewport: boolean): 'high' | 'medium' | 'low'`
Determines image priority based on usage context.

```typescript
import { getImagePriority } from '@/lib/imageCache';

const priority = getImagePriority(
  cardIsVisible,    // Is the card currently visible?
  cardIsSelected,   // Is this the user's selected version?
  cardInViewport    // Is the card in the current viewport?
);
```

#### `preloadCardImages(cardPrints: Array<{image_url?: string, image_uris?: any[]}>, priority?: 'high' | 'medium' | 'low'): void`
Preloads images for a list of card prints.

```typescript
import { preloadCardImages } from '@/lib/imageCache';

// Preload all card images when package is loaded
preloadCardImages(cardPackage.prints, 'medium');
```

### Monitoring and Statistics

#### `imageCache.getStats(): ImageCacheStats`
Returns comprehensive cache statistics.

```typescript
const stats = imageCache.getStats();
console.log(`Cache hits: ${stats.hits}`);
console.log(`Cache misses: ${stats.misses}`);
console.log(`Preloaded images: ${stats.preloaded}`);
console.log(`Total cached: ${stats.totalSize}`);
console.log(`Memory usage: ${stats.memoryUsage} bytes`);
```

#### `imageCache.getMaxCacheSize(): number`
Returns the current maximum cache size limit.

```typescript
const maxSize = imageCache.getMaxCacheSize();
console.log(`Cache size limit: ${maxSize} entries`);
```

## Usage Examples

### Basic Caching

```typescript
import { imageCache } from '@/lib/imageCache';

// Cache a card image
imageCache.set(cardImageUrl, 'medium');

// Check if cached
if (imageCache.has(cardImageUrl)) {
  // Use cached image
}
```

### Intelligent Preloading

```typescript
import { imageCache, getImagePriority } from '@/lib/imageCache';

// Preload images based on user interaction
function handleCardHover(cardPrint: CardPrint) {
  const priority = getImagePriority(true, false, true);
  imageCache.preload(cardPrint.image_url, priority);
}
```

### Batch Preloading for Card Packages

```typescript
import { preloadCardImages } from '@/lib/imageCache';

// Preload all card images when package is loaded
useEffect(() => {
  if (cardPackage?.prints) {
    preloadCardImages(cardPackage.prints, 'medium');
  }
}, [cardPackage]);
```

### Cache Management

```typescript
import { imageCache } from '@/lib/imageCache';

// Monitor cache performance
useEffect(() => {
  const interval = setInterval(() => {
    const stats = imageCache.getStats();
    console.log('Cache performance:', stats);
  }, 60000); // Every minute

  return () => clearInterval(interval);
}, []);

// Clear cache if needed
function clearImageCache() {
  imageCache.clear();
}
```

## Performance Considerations

### Memory Management
- Cache automatically limits size to prevent memory issues
- Least recently used (LRU) eviction strategy
- Configurable limits for different environments

### Network Optimization
- Images are preloaded in batches with controlled concurrency
- Prevents overwhelming Scryfall's servers
- Intelligent priority-based loading

### Browser Compatibility
- Uses standard `Image` constructor for preloading
- Graceful fallback for unsupported browsers
- Automatic cleanup of failed preloads

## Best Practices

1. **Set Appropriate Priorities**: Use 'high' for selected cards, 'medium' for visible cards, 'low' for off-screen cards
2. **Batch Preloading**: Use `preloadBatch` for multiple images to control network load
3. **Monitor Performance**: Regularly check cache statistics to optimize usage
4. **Environment Configuration**: Adjust cache sizes based on deployment environment
5. **Memory Management**: Clear cache when memory usage becomes high

## Troubleshooting

### Common Issues

**Cache not working:**
- Check if `PUBLIC_IMAGE_CACHE_SIZE` is set correctly
- Verify environment variable is accessible in browser
- Check browser console for errors

**Memory usage too high:**
- Reduce `PUBLIC_IMAGE_CACHE_SIZE` value
- Clear cache periodically with `imageCache.clear()`
- Monitor cache statistics

**Images not preloading:**
- Check network connectivity
- Verify image URLs are valid
- Check browser console for CORS errors

### Debug Information

```typescript
// Get detailed cache information
const stats = imageCache.getStats();
const maxSize = imageCache.getMaxCacheSize();
const preloadQueue = imageCache.getPreloadQueue();

console.log('Cache Debug Info:', {
  stats,
  maxSize,
  preloadQueue,
  environment: process.env.NODE_ENV,
  customCacheSize: process.env.PUBLIC_IMAGE_CACHE_SIZE
});
```

## Integration with Next.js

The service is designed to work seamlessly with Next.js:

- **Image Component**: Works with Next.js `Image` component optimization
- **Environment Variables**: Supports Next.js environment variable system
- **Build Optimization**: Automatically optimized for production builds
- **TypeScript**: Full TypeScript support with proper type definitions 