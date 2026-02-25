'use client';

import { useState, useEffect } from "react";
import ControlPanel from "@/components/ControlPanel";
import CardPackageManager from "@/components/CardPackageManager";
import ErrorDisplay from "@/components/ErrorDisplay";
import { validateCardList } from "@/lib/validation";
import { GameType, DefaultSelection, Card } from "@/types";
import { useCardPackage } from "@/hooks/useCardPackage";


export default function Home() {
  const [cards, setCards] = useState<Array<{ name: string; quantity: number }>>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameType>('paper');
  const [selectedDefaultSelection, setSelectedDefaultSelection] = useState<DefaultSelection>('newest');

  // Use the card package hook for real-time updates
  const {
    cardPackage,
    loading,
    error: packageError,
    createCardPackage,
    addCardToPackage,
    updateCardList,
    updateVersionSelection,
    clearError: clearPackageError,
    clearCardPackage
  } = useCardPackage();

  // Convert local card format to API format
  const convertToAPICards = (localCards: Array<{ name: string; quantity: number }>): Card[] => {
    return localCards.map(card => ({
      name: card.name,
      count: card.quantity
    }));
  };

  // Convert API card format to local format
  const convertToLocalCards = (apiCards: Card[]): Array<{ name: string; quantity: number }> => {
    return apiCards.map(card => ({
      name: card.name,
      quantity: card.count
    }));
  };

  // Update local cards when WebSocket receives updates
  useEffect(() => {
    if (cardPackage?.card_list) {
      // Repopulating card list from package
      const localCards = convertToLocalCards(cardPackage.card_list);
      setCards(localCards);
    } else if (cardPackage === null) {
      // Package was cleared, reset cards
      setCards([]);
    }
  }, [cardPackage]);



  const handleAddCard = (cardName: string, quantity: number) => {
    const newCards = [...cards, { name: cardName, quantity }];
    const validation = validateCardList(newCards);

    if (validation.isValid) {
      setCards(newCards);
      setValidationError(null);

      // Send real-time update via WebSocket if package exists
      if (cardPackage?.package_id) {
        updateCardList(convertToAPICards(newCards));
      }
    } else {
      setValidationError(validation.error || 'Cannot add card: would exceed 100-card limit');
    }
  };

  const handleUpdateCard = (index: number, updatedCard: { name: string; quantity: number }) => {
    const newCards = cards.map((card, i) => i === index ? updatedCard : card);
    const validation = validateCardList(newCards);

    if (validation.isValid) {
      setCards(newCards);
      setValidationError(null);

      // Send real-time update via WebSocket if package exists
      if (cardPackage?.package_id) {
        updateCardList(convertToAPICards(newCards));
      }
    } else {
      setValidationError(validation.error || 'Cannot update card: would exceed 100-card limit');
    }
  };

  const handleRemoveCard = (index: number) => {
    const newCards = cards.filter((_, i) => i !== index);
    setCards(newCards);
    setValidationError(null); // Clear error when removing cards

    // Send real-time update via WebSocket if package exists
    if (cardPackage?.package_id) {
      updateCardList(convertToAPICards(newCards));
    }
  };

  const clearValidationError = () => {
    setValidationError(null);
  };

  return (
    <div className="page-container">
      {/* Sticky Control Panel */}
      <ControlPanel
        selectedGame={selectedGame}
        onGameChange={setSelectedGame}
        selectedDefaultSelection={selectedDefaultSelection}
        onDefaultSelectionChange={setSelectedDefaultSelection}
        cardCount={cards.length}
        maxCards={100}
        packageId={cardPackage?.package_id}
        onClearPackage={clearCardPackage}
        hasPackage={!!cardPackage}
      />

      <div className="content-wrapper">
        <main className="main-content">
          {/* Error Display Section */}
          <section className="section-spacing">
            {/* Package API Errors */}
            <ErrorDisplay
              error={packageError}
              onDismiss={clearPackageError}
              type="error"
            />
            {/* Validation Errors */}
            <ErrorDisplay
              error={validationError}
              onDismiss={clearValidationError}
              type="warning"
            />
          </section>

          {/* Card Package Manager Section */}
          <CardPackageManager
            cards={cards}
            onAddCard={handleAddCard}
            onUpdateCard={handleUpdateCard}
            onRemoveCard={handleRemoveCard}
            validateCardList={validateCardList}
            selectedGame={selectedGame}
            onGameChange={setSelectedGame}
            selectedDefaultSelection={selectedDefaultSelection}
            onDefaultSelectionChange={setSelectedDefaultSelection}
            cardPackage={cardPackage}
            loading={loading}
            error={packageError}
            createCardPackage={createCardPackage}
            addCardToPackage={addCardToPackage}
            clearError={clearPackageError}
            clearCardPackage={clearCardPackage}
            updateCardList={updateCardList}
            updateVersionSelection={updateVersionSelection}
          />
        </main>
      </div>
    </div>
  );
}
