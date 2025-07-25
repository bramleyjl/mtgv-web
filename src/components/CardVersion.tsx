'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CardPrint } from '@/types';

interface CardVersionProps {
  print: CardPrint;
  isSelected: boolean;
  onSelect: (scryfallId: string) => void;
  cardName: string;
}

export default function CardVersion({ print, isSelected, onSelect, cardName }: CardVersionProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Extract image URL from image_uris or use image_url if available
  const getImageUrl = () => {
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
  };

  // Magic card back image as fallback (local file)
  const getFallbackImageUrl = () => {
    return '/magic-card-back.jpg';
  };

  const imageUrl = getImageUrl();
  const fallbackImageUrl = getFallbackImageUrl();


  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };





  const handleClick = () => {
    console.log(`CardVersion clicked for ${cardName}:`, {
      scryfallId: print.scryfall_id,
      isSelected,
      cardName
    });
    onSelect(print.scryfall_id);
  };

  return (
    <div 
      className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      }`}
      onClick={handleClick}
    >
      {/* Card Image */}
      <div className="relative aspect-[745/1040] w-full overflow-hidden rounded-t-lg">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}
        
        {!imageError && imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${cardName} - ${print.set_name || 'Unknown Set'}`}
            fill
            className="object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <Image
            src={fallbackImageUrl}
            alt="Magic card back"
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </div>

      {/* Card Info */}
      <div className="p-3">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {print.set_name || 'Unknown Set'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          #{print.collector_number || 'N/A'}
        </div>
        {print.price !== undefined && (
          <div className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
            ${print.price.toFixed(2)}
          </div>
        )}
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="rounded-full bg-blue-500 p-1">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 