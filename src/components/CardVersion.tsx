'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { CardPrint } from '@/types';
import { imageCache, getImagePriority } from '@/lib/imageCache';

interface CardVersionProps {
  print: CardPrint;
  isSelected: boolean;
  onSelect: (scryfallId: string) => void;
  cardName: string;
  gameType?: 'paper' | 'mtgo' | 'arena';
}

export default function CardVersion({ print, isSelected, onSelect, cardName, gameType = 'paper' }: CardVersionProps) {
  // Use state to track image loading state - this will trigger re-renders
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);


  // Memoize the image URL to prevent unnecessary recalculations
  const imageUrl = useMemo(() => {
    if (print.image_url) {
      return print.image_url;
    }
    
    if (print.image_uris && Array.isArray(print.image_uris) && print.image_uris.length > 0) {
      // The backend returns image_uris as an array, take the first one
      const imageUri = print.image_uris[0];
      if (imageUri && imageUri.normal) {
        return imageUri.normal;
      }
    }
    
    return null;
  }, [print.image_url, print.image_uris]);

  // Magic card back image as fallback (local file)
  const fallbackImageUrl = '/magic-card-back.jpg';

  // Reset loading state when image URL changes
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
    
    // Fallback: if onLoad doesn't fire within 3 seconds, assume image is loaded
    const fallbackTimer = setTimeout(() => {
      setImageLoading(false);
    }, 3000);
    
    return () => clearTimeout(fallbackTimer);
  }, [imageUrl]);

  // Cache the image when it's available (only if not already cached)
  useEffect(() => {
    if (imageUrl && !imageCache.has(imageUrl)) {
      const priority = getImagePriority(true, isSelected, true); // Assume visible and in viewport
      imageCache.set(imageUrl, priority);
    }
  }, [imageUrl, isSelected]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  const handleRetryImage = useCallback(() => {
    setImageError(false);
    setImageLoading(true);
    // Force a re-render by updating the key or URL
    // This will trigger the useEffect to reset the loading state
  }, []);

  // Preload image when component mounts (only if not already cached)
  useEffect(() => {
    if (imageUrl && !imageCache.has(imageUrl)) {
      const priority = getImagePriority(true, isSelected, true);
      imageCache.preload(imageUrl, priority);
    }
  }, [imageUrl, isSelected]);

  const handleClick = useCallback(() => {
    onSelect(print.scryfall_id);
  }, [onSelect, print.scryfall_id]);

  // Format price based on game type
  const priceDisplay = useMemo(() => {
    if (gameType === 'arena') {
      return null; // No prices for Arena
    }
    
    // Extract price from the prices object based on game type
    let price = null;
    if (print.prices) {
      if (gameType === 'mtgo') {
        price = print.prices.tix;
      } else {
        // For paper, use USD price
        price = print.prices.usd;
      }
    }
    
    if (price === undefined || price === null) {
      return null;
    }

    // Handle MongoDB Decimal128 format
    const priceValue = typeof price === 'object' && price.$numberDecimal 
      ? parseFloat(price.$numberDecimal) 
      : typeof price === 'number' 
        ? price 
        : typeof price === 'string'
          ? parseFloat(price)
          : null;

    if (priceValue === null || isNaN(priceValue)) {
      return null;
    }

    const currency = gameType === 'mtgo' ? 'Tix' : 'USD';
    return `${currency} ${priceValue.toFixed(2)}`;
  }, [print.prices, gameType]);

  return (
    <div 
      data-testid="card-version"
      className={`card-version transition-all hover-scale ${
        isSelected 
          ? 'card-version-selected' 
          : 'card-version-unselected'
      }`}
      onClick={handleClick}
    >
      {/* Card Image */}
      <div className="card-image-container">
        {/* Always show fallback image as background */}
        <Image
          src={fallbackImageUrl}
          alt="Magic card back"
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
        
        {/* Show real image when available */}
        {imageUrl && !imageError && (
          <Image
            src={imageUrl}
            alt={`${cardName} - ${print.set_name || 'Unknown Set'}`}
            fill
            className={`card-image transition-opacity ${
              imageLoading ? 'card-image-loading' : 'card-image-loaded'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        
        {/* Show spinner during loading */}
        {imageUrl && imageLoading && (
          <div className="absolute inset-0 flex-center">
            <div data-testid="loading-spinner" className="loading-spinner"></div>
          </div>
        )}
        
        {/* Show error state when image fails to load */}
        {imageUrl && imageError && (
          <div className="absolute inset-0 flex-center error-placeholder">
            <div className="text-center p-2">
              <div className="error-icon">⚠️</div>
              <div className="error-text">Image failed to load</div>
              <button 
                onClick={handleRetryImage}
                className="retry-button"
                data-testid="retry-button"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="card-info">
        <div className="card-set-name">
          {print.set_name || 'Unknown Set'}
        </div>
        <div className="card-number">
          #{print.collector_number || 'N/A'}
        </div>
        {priceDisplay && (
          <div className="card-price">
            {priceDisplay}
          </div>
        )}
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="selection-indicator">
            <div className="selection-indicator-bg">
              <svg data-testid="selected-indicator" className="selection-indicator-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 