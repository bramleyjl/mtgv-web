'use client';

import { useState, useEffect } from "react";
import CardInput from "@/components/CardInput";
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
    error: packageError, 
    updateCardList,
    clearError: clearPackageError 
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
    }
  }, [cardPackage?.card_list]);

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
    <div className="min-h-screen p-8 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">MTGV Card Package Builder</h1>
        </header>

        <main className="space-y-8">
          {/* Error Display Section */}
          <section className="space-y-4">
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

          {/* Card Input Section */}
          <section className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Add Cards</h2>
            <CardInput 
              onAddCard={handleAddCard} 
              currentCards={cards}
              validateCardList={validateCardList}
            />
          </section>

          {/* Card Package Manager Section */}
          <CardPackageManager 
            cards={cards}
            onUpdateCard={handleUpdateCard}
            onRemoveCard={handleRemoveCard}
            validateCardList={validateCardList}
            selectedGame={selectedGame}
            onGameChange={setSelectedGame}
            selectedDefaultSelection={selectedDefaultSelection}
            onDefaultSelectionChange={setSelectedDefaultSelection}
          />
        </main>
      </div>
    </div>
  );
}
