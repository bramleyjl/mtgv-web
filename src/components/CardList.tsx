'use client';

import React from 'react';
import EditableCardName from './EditableCardName';
import ErrorDisplay from './ErrorDisplay';
import CardVersion from './CardVersion';
import { useCardPackage } from '@/hooks/useCardPackage';
import { GameType, Card as CardType, DefaultSelection, CardPrint } from '@/types';

interface Card {
  name: string;
  quantity: number;
}

interface CardListProps {
  cards: Card[];
  onUpdateCard: (index: number, card: Card) => void;
  onRemoveCard: (index: number) => void;
  validateCardList?: (cards: Array<{ name: string; quantity: number }>) => { isValid: boolean; error?: string; totalCards?: number };
  selectedGame: GameType;
  onGameChange: (game: GameType) => void;
  selectedDefaultSelection: DefaultSelection;
  onDefaultSelectionChange: (selection: DefaultSelection) => void;
}

export default function CardList({ 
  cards, 
  onUpdateCard, 
  onRemoveCard, 
  validateCardList,
  selectedGame,
  onGameChange,
  selectedDefaultSelection,
  onDefaultSelectionChange
}: CardListProps) {
  const { 
    cardPackage, 
    loading, 
    error, 
    createCardPackage, 
    clearError, 
    clearCardPackage,
    updateCardList,
    updateVersionSelection,
    isConnected
  } = useCardPackage();

  // Convert local card format to API format for WebSocket updates
  const convertToAPICards = (localCards: Array<{ name: string; quantity: number }>): CardType[] => {
    return localCards.map(card => ({
      name: card.name,
      count: card.quantity
    }));
  };

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
      const updatedCard = { ...card, quantity: card.quantity + 1 };
      onUpdateCard(index, updatedCard);
      
      // Send real-time update via WebSocket if package exists
      if (cardPackage?.id) {
        const newCards = cards.map((c, i) => i === index ? updatedCard : c);
        updateCardList(convertToAPICards(newCards));
      }
    }
  };

  const handleDecreaseQuantity = (index: number) => {
    const card = cards[index];
    if (card.quantity > 1) {
      const updatedCard = { ...card, quantity: card.quantity - 1 };
      onUpdateCard(index, updatedCard);
      
      // Send real-time update via WebSocket if package exists
      if (cardPackage?.id) {
        const newCards = cards.map((c, i) => i === index ? updatedCard : c);
        updateCardList(convertToAPICards(newCards));
      }
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const card = cards[index];
    let updatedCard: Card;
    
    // Allow empty string for clearing
    if (value === '') {
      updatedCard = { ...card, quantity: 0 };
    } else {
      const newQuantity = parseInt(value) || 1;
      const maxQuantity = getMaxQuantityForCard(index, card.name);
      const clampedQuantity = Math.max(1, Math.min(maxQuantity, newQuantity));
      updatedCard = { ...card, quantity: clampedQuantity };
    }
    
    onUpdateCard(index, updatedCard);
    
    // Send real-time update via WebSocket if package exists
    if (cardPackage?.id) {
      const newCards = cards.map((c, i) => i === index ? updatedCard : c);
      updateCardList(convertToAPICards(newCards));
    }
  };

  const handleQuantityBlur = (index: number, value: string) => {
    const card = cards[index];
    // If empty or invalid, default to 1
    if (value === '' || isNaN(parseInt(value))) {
      const updatedCard = { ...card, quantity: 1 };
      onUpdateCard(index, updatedCard);
      
      // Send real-time update via WebSocket if package exists
      if (cardPackage?.id) {
        const newCards = cards.map((c, i) => i === index ? updatedCard : c);
        updateCardList(convertToAPICards(newCards));
      }
    }
  };

  const handleCardNameUpdate = (index: number, newName: string) => {
    const card = cards[index];
    const updatedCard = { ...card, name: newName };
    onUpdateCard(index, updatedCard);
    
    // Send real-time update via WebSocket if package exists
    if (cardPackage?.id) {
      const newCards = cards.map((c, i) => i === index ? updatedCard : c);
      updateCardList(convertToAPICards(newCards));
    }
  };

  const handleCardNameCancel = () => {
    // No-op for cancel in list context
  };

  const handleCreatePackage = async () => {
    if (cards.length === 0) return;
    
    // Convert cards to the format expected by the API
    const cardList: CardType[] = cards.map(card => ({
      name: card.name,
      count: card.quantity
    }));
    
    await createCardPackage(cardList, selectedGame, selectedDefaultSelection);
  };

  const handleClearPackage = () => {
    clearCardPackage();
  };

  const handleVersionSelection = (cardName: string, scryfallId: string) => {
    // Send real-time update via WebSocket if package exists
    if (cardPackage?.id) {
      updateVersionSelection(cardName, scryfallId);
    }
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
        className="mb-4"
      />

      {/* Create Package Button */}
      <div className="mb-4">
        <button
          onClick={handleCreatePackage}
          disabled={loading || cards.length === 0}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating Package...</span>
            </div>
          ) : (
            'Create Package'
          )}
        </button>
      </div>

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

      {/* Package Results with Version Selection */}
      {cardPackage && (
        <div className="mt-6 p-4 bg-green-900 border border-green-700 rounded-md">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-green-200">Package Created Successfully!</h3>
            <button
              onClick={handleClearPackage}
              className="text-green-400 hover:text-green-300 text-sm"
            >
              Clear
            </button>
          </div>
          
          <div className="space-y-2 text-sm text-green-100">
            <p><strong>Game Type:</strong> {cardPackage.game}</p>
            <p><strong>Default Selection:</strong> {cardPackage.default_selection}</p>
            <p><strong>Cards in Package:</strong></p>
            {cardPackage.package_entries && cardPackage.package_entries.length > 0 ? (
              <div className="space-y-3">
                {cardPackage.package_entries.map((entry, index) => (
                  <div key={`${entry.oracle_id || entry.name}-${index}`} className="bg-green-800 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-green-200">
                        {entry.count}x {entry.name}
                      </span>
                      {entry.not_found && (
                        <span className="text-yellow-300 text-xs">(not found)</span>
                      )}
                    </div>
                    
                    {/* Version Selection */}
                    {!entry.not_found && entry.card_prints && entry.card_prints.length > 1 && (
                      <div className="mt-2">
                        <p className="text-xs text-green-300 mb-2">Select Version:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {entry.card_prints.map((print, printIndex) => (
                            <CardVersion
                              key={print.scryfall_id}
                              print={print}
                              isSelected={entry.selected_print === print.scryfall_id}
                              onSelect={(scryfallId) => handleVersionSelection(entry.name, scryfallId)}
                              cardName={entry.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Show selected version info */}
                    {!entry.not_found && entry.selected_print && (
                      <div className="mt-1 text-xs text-green-300">
                        Selected: {entry.card_prints.find(p => p.scryfall_id === entry.selected_print)?.set_name || 'Unknown Set'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-yellow-300">No cards found in package</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
} 