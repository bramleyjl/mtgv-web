'use client';

import React from 'react';
import EditableCardName from './EditableCardName';

interface Card {
  name: string;
  quantity: number;
}

interface CardListProps {
  cards: Card[];
  onUpdateCard: (index: number, card: Card) => void;
  onRemoveCard: (index: number) => void;
  validateCardList?: (cards: Array<{ name: string; quantity: number }>) => { isValid: boolean; error?: string; totalCards?: number };
}

export default function CardList({ cards, onUpdateCard, onRemoveCard, validateCardList }: CardListProps) {
  // Get the maximum quantity that can be set for a specific card without exceeding the limit
  const getMaxQuantityForCard = (index: number, cardName: string): number => {
    if (!validateCardList) return 100;
    
    const otherCards = cards.filter((_, i) => i !== index);
    const otherCardsTotal = otherCards.reduce((sum, card) => sum + (card.quantity || 1), 0);
    const remainingSlots = 100 - otherCardsTotal;
    return Math.max(1, Math.min(100, remainingSlots));
  };

  const handleIncreaseQuantity = (index: number) => {
    const card = cards[index];
    const maxQuantity = getMaxQuantityForCard(index, card.name);
    if (card.quantity < maxQuantity) {
      onUpdateCard(index, { ...card, quantity: card.quantity + 1 });
    }
  };

  const handleDecreaseQuantity = (index: number) => {
    const card = cards[index];
    if (card.quantity > 1) {
      onUpdateCard(index, { ...card, quantity: card.quantity - 1 });
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const card = cards[index];
    // Allow empty string for clearing
    if (value === '') {
      onUpdateCard(index, { ...card, quantity: 0 });
    } else {
      const newQuantity = parseInt(value) || 1;
      const maxQuantity = getMaxQuantityForCard(index, card.name);
      const clampedQuantity = Math.max(1, Math.min(maxQuantity, newQuantity));
      onUpdateCard(index, { ...card, quantity: clampedQuantity });
    }
  };

  const handleQuantityBlur = (index: number, value: string) => {
    const card = cards[index];
    // If empty or invalid, default to 1
    if (value === '' || isNaN(parseInt(value))) {
      onUpdateCard(index, { ...card, quantity: 1 });
    }
  };

  const handleCardNameUpdate = (index: number, newName: string) => {
    const card = cards[index];
    onUpdateCard(index, { ...card, name: newName });
  };

  const handleCardNameCancel = () => {
    // No-op for cancel in list context
  };

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">
        Card List ({cards.length} cards)
      </h2>
      <div className="space-y-2">
        {cards.map((card, index) => (
          <div
            key={`${card.name}-${index}`}
            className="flex justify-between items-center py-3 px-4 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors border border-gray-600"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <EditableCardName
                cardName={card.name}
                onUpdate={(newName) => handleCardNameUpdate(index, newName)}
                onCancel={handleCardNameCancel}
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* Quantity Controls */}
              <div className="flex items-center border border-gray-500 rounded-md bg-gray-600">
                <button
                  onClick={() => handleDecreaseQuantity(index)}
                  disabled={card.quantity <= 1}
                  className="px-2 py-1 text-gray-300 hover:text-white disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                
                <input
                  type="number"
                  value={card.quantity === 0 ? '' : card.quantity}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  onBlur={(e) => handleQuantityBlur(index, e.target.value)}
                  min="1"
                  max={getMaxQuantityForCard(index, card.name)}
                  className="w-10 text-center border-none focus:outline-none focus:ring-0 text-sm bg-gray-600 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                
                <button
                  onClick={() => handleIncreaseQuantity(index)}
                  disabled={card.quantity >= getMaxQuantityForCard(index, card.name)}
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