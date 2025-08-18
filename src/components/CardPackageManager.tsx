'use client';

import React from 'react';
import CardList from './CardList';
import CardDisplay from './CardDisplay';
import { useCardPackage } from '@/hooks/useCardPackage';
import { GameType, DefaultSelection, Card } from '@/types';

interface CardPackageManagerProps {
  cards: Array<{ name: string; quantity: number }>;
  onAddCard: (cardName: string, quantity: number) => void;
  onUpdateCard: (index: number, card: { name: string; quantity: number }) => void;
  onRemoveCard: (index: number) => void;
  validateCardList?: (cards: Array<{ name: string; quantity: number }>) => { isValid: boolean; error?: string; totalCards?: number };
  selectedGame: GameType;
  onGameChange: (game: GameType) => void;
  selectedDefaultSelection: DefaultSelection;
  onDefaultSelectionChange: (selection: DefaultSelection) => void;
}

export default function CardPackageManager({
  cards,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
  validateCardList,
  selectedGame,
  onGameChange,
  selectedDefaultSelection,
  onDefaultSelectionChange
}: CardPackageManagerProps) {
  const { 
    cardPackage, 
    loading, 
    error, 
    createCardPackage, 
    clearError, 
    clearCardPackage,
    updateCardList,
    updateVersionSelection
  } = useCardPackage();

  // Convert local card format to API format for WebSocket updates
  const convertToAPICards = (localCards: Array<{ name: string; quantity: number }>): Card[] => {
    return localCards.map(card => ({
      name: card.name,
      count: card.quantity
    }));
  };

  // Get the maximum quantity that can be set for a specific card without exceeding the limit
  const getMaxQuantityForCard = (index: number): number => {
    if (!validateCardList) return 100;
    
    const otherCards = cards.filter((_, i) => i !== index);
    const otherCardsTotal = otherCards.reduce((sum, card) => sum + (card.quantity || 1), 0);
    const remainingSlots = 100 - otherCardsTotal;
    return Math.max(1, Math.min(100, remainingSlots));
  };

  const handleIncreaseQuantity = (index: number) => {
    const card = cards[index];
    const maxQuantity = getMaxQuantityForCard(index);
    if (card.quantity < maxQuantity) {
      const updatedCard = { ...card, quantity: card.quantity + 1 };
      onUpdateCard(index, updatedCard);
      
      if (cardPackage?.package_id) {
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
      
      if (cardPackage?.package_id) {
        const newCards = cards.map((c, i) => i === index ? updatedCard : c);
        updateCardList(convertToAPICards(newCards));
      }
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const card = cards[index];
    let updatedCard: { name: string; quantity: number };
    
    // Allow empty string for clearing
    if (value === '') {
      updatedCard = { ...card, quantity: 0 };
    } else {
      const newQuantity = parseInt(value) || 1;
      const maxQuantity = getMaxQuantityForCard(index);
      const clampedQuantity = Math.max(1, Math.min(maxQuantity, newQuantity));
      updatedCard = { ...card, quantity: clampedQuantity };
    }
    
    onUpdateCard(index, updatedCard);
    
    // Send real-time update via WebSocket if package exists
    if (cardPackage?.package_id) {
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
      if (cardPackage?.package_id) {
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
    if (cardPackage?.package_id) {
      const newCards = cards.map((c, i) => i === index ? updatedCard : c);
      updateCardList(convertToAPICards(newCards));
    }
  };



  const handleCreatePackage = async () => {
    if (cards.length === 0) return;
    
    // Convert cards to the format expected by the API
    const cardList: Card[] = cards.map(card => ({
      name: card.name,
      count: card.quantity
    }));
    
    await createCardPackage(cardList, selectedGame, selectedDefaultSelection);
  };

  const handleCreatePackageFromCards = async (newCards: Array<{ name: string; count: number }>) => {
    if (newCards.length === 0) return;

    const cardList: Card[] = newCards;
    await createCardPackage(cardList, selectedGame, selectedDefaultSelection);
  };

  const handleClearPackage = () => {
    clearCardPackage();
  };

  const handleVersionSelection = (oracleId: string, scryfallId: string) => {
    if (cardPackage?.package_id) {
      updateVersionSelection(oracleId, scryfallId);
    }
  };

  const handlePasteCards = (newCards: Array<{ name: string; quantity: number }>) => {
    // Replace the current card list with the pasted cards
    newCards.forEach((card, index) => {
      onUpdateCard(index, card);
    });
    
    // Remove any extra cards if the new list is shorter
    if (newCards.length < cards.length) {
      for (let i = newCards.length; i < cards.length; i++) {
        onRemoveCard(i);
      }
    }
    
    // Send real-time update via WebSocket if package exists
    if (cardPackage?.package_id) {
      updateCardList(convertToAPICards(newCards));
    }
  };

  const handleAddCard = (cardName: string, quantity: number) => {
    // Use the passed onAddCard prop to add the card
    onAddCard(cardName, quantity);
  };

  return (
    <div className="gap-large">
      {/* Card List Section */}
      <CardList 
        cards={cards}
        onAddCard={handleAddCard}
        onUpdateCard={onUpdateCard}
        onRemoveCard={onRemoveCard}
        validateCardList={validateCardList ?? (() => ({ isValid: true }))}
        selectedGame={selectedGame}
        onGameChange={onGameChange}
        selectedDefaultSelection={selectedDefaultSelection}
        onDefaultSelectionChange={onDefaultSelectionChange}
        onIncreaseQuantity={handleIncreaseQuantity}
        onDecreaseQuantity={handleDecreaseQuantity}
        onQuantityChange={handleQuantityChange}
        onQuantityBlur={handleQuantityBlur}
        onCardNameUpdate={handleCardNameUpdate}
        onPasteCards={handlePasteCards}
        onCreatePackage={handleCreatePackage}
        onCreatePackageFromCards={handleCreatePackageFromCards}
        loading={loading}
        error={error}
        clearError={clearError}
      />

      {/* Card Display Section */}
      <CardDisplay 
        cardPackage={cardPackage}
        onVersionSelection={handleVersionSelection}
        onClearPackage={handleClearPackage}
      />
    </div>
  );
} 