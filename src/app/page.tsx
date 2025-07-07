'use client';

import { useState } from "react";
import CardInput from "@/components/CardInput";
import CardList from "@/components/CardList";
import { validateCardList } from "@/lib/validation";

export default function Home() {
  const [cards, setCards] = useState<Array<{ name: string; quantity: number }>>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddCard = (cardName: string, quantity: number) => {
    const newCards = [...cards, { name: cardName, quantity }];
    const validation = validateCardList(newCards);
    
    if (validation.isValid) {
      setCards(newCards);
      setValidationError(null);
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
    } else {
      setValidationError(validation.error || 'Cannot update card: would exceed 100-card limit');
    }
  };

  const handleRemoveCard = (index: number) => {
    setCards(prev => prev.filter((_, i) => i !== index));
    setValidationError(null); // Clear error when removing cards
  };

  // Calculate current total for display
  const currentTotal = cards.reduce((sum, card) => sum + (card.quantity || 1), 0);
  const validation = validateCardList(cards);

  return (
    <div className="min-h-screen p-8 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">MTGV Card Package Builder</h1>
          <p className="text-gray-300">Test the CardInput component</p>
        </header>

        <main className="space-y-8">
          {/* Card Input Section */}
          <section className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Add Cards</h2>
            
            {/* Card Limit Display */}
            <div className="mb-4 p-3 bg-gray-700 rounded-md border border-gray-600">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Card Limit:</span>
                <span className={`font-medium ${validation.isValid ? 'text-green-400' : 'text-red-400'}`}>
                  {currentTotal} / 100 cards
                </span>
              </div>
              {validationError && (
                <div className="mt-2 text-sm text-red-400">
                  {validationError}
                </div>
              )}
            </div>
            
            <CardInput 
              onAddCard={handleAddCard} 
              currentCards={cards}
              validateCardList={validateCardList}
            />
          </section>

          {/* Card List Section */}
          <CardList 
            cards={cards}
            onUpdateCard={handleUpdateCard}
            onRemoveCard={handleRemoveCard}
            validateCardList={validateCardList}
          />
        </main>
      </div>
    </div>
  );
}
