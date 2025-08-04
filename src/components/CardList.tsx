'use client';

import React from 'react';
import EditableCardName from './EditableCardName';
import ErrorDisplay from './ErrorDisplay';
import { GameType, DefaultSelection } from '@/types';

interface CardListProps {
  cards: { name: string; quantity: number }[];
  onUpdateCard: (index: number, card: { name: string; quantity: number }) => void;
  onRemoveCard: (index: number) => void;
  validateCardList: (cards: Array<{ name: string; quantity: number }>) => { isValid: boolean; error?: string; totalCards?: number };
  selectedGame: GameType;
  onGameChange: (game: GameType) => void;
  selectedDefaultSelection: DefaultSelection;
  onDefaultSelectionChange: (selection: DefaultSelection) => void;
  onIncreaseQuantity: (index: number) => void;
  onDecreaseQuantity: (index: number) => void;
  onQuantityChange: (index: number, value: string) => void;
  onQuantityBlur: (index: number, value: string) => void;
  onCardNameUpdate: (index: number, newName: string) => void;
  onCardNameCancel: () => void;
  onCreatePackage: () => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export default function CardList({ 
  cards, 
  onRemoveCard, 
  validateCardList,
  selectedGame,
  onGameChange,
  selectedDefaultSelection,
  onDefaultSelectionChange,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onQuantityChange,
  onQuantityBlur,
  onCardNameUpdate,
  onCardNameCancel,
  onCreatePackage,
    loading, 
    error, 
    clearError
}: CardListProps) {

  // Get the maximum quantity that can be set for a specific card without exceeding the limit
  const getMaxQuantityForCard = (index: number): number => {
    if (!validateCardList) return 100;
    
    const otherCards = cards.filter((_, i) => i !== index);
    const otherCardsTotal = otherCards.reduce((sum, card) => sum + (card.quantity || 1), 0);
    const remainingSlots = 100 - otherCardsTotal;
    return Math.max(1, Math.min(100, remainingSlots));
  };

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">
          Card List
        </h2>
        
        {/* Game Type Selection in the middle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onGameChange('paper')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedGame === 'paper'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Paper
          </button>
          <button
            onClick={() => onGameChange('mtgo')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedGame === 'mtgo'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            MTGO
          </button>
          <button
            onClick={() => onGameChange('arena')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedGame === 'arena'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Arena
          </button>
        </div>
        
        {/* Default Selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Default:</span>
          <button
            onClick={() => onDefaultSelectionChange('newest')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              selectedDefaultSelection === 'newest'
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => onDefaultSelectionChange('oldest')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              selectedDefaultSelection === 'oldest'
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Oldest
          </button>
          <button
            onClick={() => onDefaultSelectionChange('least_expensive')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              selectedDefaultSelection === 'least_expensive'
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Least Exp
          </button>
          <button
            onClick={() => onDefaultSelectionChange('most_expensive')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              selectedDefaultSelection === 'most_expensive'
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Most Exp
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-green-400">
            {cards.length}/100 cards
          </span>
        </div>
      </div>

      {/* Error Display */}
      <ErrorDisplay 
        error={error} 
        onDismiss={clearError}
        type="error"
      />

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onCreatePackage}
            disabled={cards.length === 0 || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Creating Package...' : 'Create Package'}
          </button>
          
          {/*
          {cardPackage && (
        <button
              onClick={onClearPackage}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
            >
              Clear Package
            </button>
          )}
          */}
        </div>
        
      </div>

      {/* Card List */}
      <div className="space-y-2">
        {cards.map((card, index) => (
          <div
            key={`${card.name}-${index}`}
            className="flex justify-between items-center py-3 px-4 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors border border-gray-600"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <EditableCardName
                cardName={card.name}
                onUpdate={(newName) => onCardNameUpdate(index, newName)}
                onCancel={onCardNameCancel}
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* Quantity Controls */}
              <div className="flex items-center border border-gray-500 rounded-md bg-gray-600">
                <button
                  onClick={() => onDecreaseQuantity(index)}
                  disabled={card.quantity <= 1}
                  className="px-2 py-1 text-gray-300 hover:text-white disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                
                <input
                  type="number"
                  value={card.quantity === 0 ? '' : card.quantity}
                  onChange={(e) => onQuantityChange(index, e.target.value)}
                  onBlur={(e) => onQuantityBlur(index, e.target.value)}
                  min="1"
                  max={getMaxQuantityForCard(index)}
                  className="w-10 text-center border-none focus:outline-none focus:ring-0 text-sm bg-gray-600 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                
                <button
                  onClick={() => onIncreaseQuantity(index)}
                  disabled={card.quantity >= getMaxQuantityForCard(index)}
                  className="px-2 py-1 text-gray-300 hover:text-white disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              
              {/* Remove Button */}
              <button
                onClick={() => onRemoveCard(index)}
                className="px-2 py-1 text-red-400 hover:text-red-300 focus:outline-none focus:ring-1 focus:ring-red-500 rounded"
                aria-label="Remove card"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 