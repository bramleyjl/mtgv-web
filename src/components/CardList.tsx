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
    <section className="card-list-section">
      <div className="flex-between mb-medium">
        <h2 className="section-header">
          Card List
        </h2>
        
        {/* Game Type Selection in the middle */}
        <div className="flex-center gap-small">
          <button
            onClick={() => onGameChange('paper')}
            className={`btn-game ${
              selectedGame === 'paper'
                ? 'btn-game-active'
                : 'btn-game-inactive'
            }`}
          >
            Paper
          </button>
          <button
            onClick={() => onGameChange('mtgo')}
            className={`btn-game ${
              selectedGame === 'mtgo'
                ? 'btn-game-active'
                : 'btn-game-inactive'
            }`}
          >
            MTGO
          </button>
          <button
            onClick={() => onGameChange('arena')}
            className={`btn-game ${
              selectedGame === 'arena'
                ? 'btn-game-active'
                : 'btn-game-inactive'
            }`}
          >
            Arena
          </button>
        </div>
        
        {/* Default Selection */}
        <div className="flex-center gap-small">
          <span className="text-body-xs text-body-muted">Default:</span>
          <button
            onClick={() => onDefaultSelectionChange('newest')}
            className={`btn-default ${
              selectedDefaultSelection === 'newest'
                ? 'btn-default-active'
                : 'btn-default-inactive'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => onDefaultSelectionChange('oldest')}
            className={`btn-default ${
              selectedDefaultSelection === 'oldest'
                ? 'btn-default-active'
                : 'btn-default-inactive'
            }`}
          >
            Oldest
          </button>
          <button
            onClick={() => onDefaultSelectionChange('least_expensive')}
            className={`btn-default ${
              selectedDefaultSelection === 'least_expensive'
                ? 'btn-default-active'
                : 'btn-default-inactive'
            }`}
          >
            Least Exp
          </button>
          <button
            onClick={() => onDefaultSelectionChange('most_expensive')}
            className={`btn-default ${
              selectedDefaultSelection === 'most_expensive'
                ? 'btn-default-active'
                : 'btn-default-inactive'
            }`}
          >
            Most Exp
          </button>
        </div>
        
        <div className="flex-center gap-small">
          <span className="text-success text-body-small font-medium">
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
      <div className="flex-between mb-medium">
        <div className="flex-center gap-small">
          <button
            onClick={onCreatePackage}
            disabled={cards.length === 0 || loading}
            className="btn-primary"
          >
            {loading ? 'Creating Package...' : 'Create Package'}
          </button>
          
          {/*
          {cardPackage && (
        <button
              onClick={onClearPackage}
              className="btn-secondary"
            >
              Clear Package
            </button>
          )}
          */}
        </div>
        
      </div>

      {/* Card List */}
      <div className="gap-small">
        {cards.map((card, index) => (
          <div
            key={`${card.name}-${index}`}
            className="card-list-item"
          >
            <div className="card-list-content">
              <EditableCardName
                cardName={card.name}
                onUpdate={(newName) => onCardNameUpdate(index, newName)}
              />
            </div>
            
            <div className="card-list-controls">
              {/* Quantity Controls */}
              <div className="quantity-controls">
                <button
                  onClick={() => onDecreaseQuantity(index)}
                  disabled={card.quantity <= 1}
                  className="btn-quantity"
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
                  className="input-field"
                />
                
                <button
                  onClick={() => onIncreaseQuantity(index)}
                  disabled={card.quantity >= getMaxQuantityForCard(index)}
                  className="btn-quantity"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              
              {/* Remove Button */}
              <button
                onClick={() => onRemoveCard(index)}
                className="btn-remove"
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