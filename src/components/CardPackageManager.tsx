'use client';

import React from 'react';
import CardList from './CardList';
import CardDisplay from './CardDisplay';
import { GameType, DefaultSelection, Card, CardPackage } from '@/types';

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
  // Card package hook functions passed from parent
  cardPackage: CardPackage | null;
  loading: boolean;
  error: string | null;
  createCardPackage: (cards: Card[], game: GameType, defaultSelection: DefaultSelection) => Promise<void>;
  addCardToPackage: (cardName: string, quantity?: number, game?: GameType, defaultSelection?: DefaultSelection) => Promise<void>;
  clearError: () => void;
  clearCardPackage: () => void;
  updateCardList: (cards: Card[]) => void;
  updateVersionSelection: (oracleId: string, scryfallId: string) => void;
}

export default function CardPackageManager({
  cards,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
  validateCardList,
  selectedGame,
  selectedDefaultSelection,
  // Receive hook functions from parent
  cardPackage,
  error,
  createCardPackage,
  addCardToPackage,
  clearError,
  updateCardList,
  updateVersionSelection
}: CardPackageManagerProps) {

  // Convert local card format to API format for WebSocket updates
  const convertToAPICards = (localCards: Array<{ name: string; quantity: number }>): Card[] => {
    return localCards.map(card => ({
      name: card.name,
      count: card.quantity
    }));
  };

  const handleCreatePackageFromCards = async (newCards: Array<{ name: string; count: number }>) => {
    if (newCards.length === 0) return;

    const cardList: Card[] = newCards;
    await createCardPackage(cardList, selectedGame, selectedDefaultSelection);
  };

  const handleVersionSelection = (oracleId: string, scryfallId: string) => {
    if (cardPackage?.package_id) {
      updateVersionSelection(oracleId, scryfallId);
    }
  };

  const handleUpdateQuantity = (cardName: string, newQuantity: number) => {
    if (!cardPackage?.package_id) return;

    // Update the card list via WebSocket
    const updatedCards = (cardPackage.card_list || []).map(card =>
      card.name === cardName ? { ...card, count: newQuantity } : card
    );

    updateCardList(updatedCards);
  };

  const handleRemoveCardByName = (cardName: string) => {
    if (!cardPackage?.package_id) return;

    // Remove the card from the list via WebSocket
    const updatedCards = (cardPackage.card_list || []).filter(card => card.name !== cardName);

    updateCardList(updatedCards);
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
        onAddCardToPackage={addCardToPackage}
        validateCardList={validateCardList ?? (() => ({ isValid: true }))}
        selectedGame={selectedGame}
        selectedDefaultSelection={selectedDefaultSelection}
        onPasteCards={handlePasteCards}
        onCreatePackageFromCards={handleCreatePackageFromCards}
        packageCardList={cardPackage?.card_list ?? null}
        error={error}
        clearError={clearError}
      />

      {/* Card Display Section */}
      <CardDisplay
        cardPackage={cardPackage}
        onVersionSelection={handleVersionSelection}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveCard={handleRemoveCardByName}
      />
    </div>
  );
}
