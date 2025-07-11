'use client';

import { useState } from "react";
import CardInput from "@/components/CardInput";
import CardList from "@/components/CardList";
import CacheMonitor from "@/components/CacheMonitor";
import { validateCardList } from "@/lib/validation";
import { GameType } from "@/types";

export default function Home() {
  const [cards, setCards] = useState<Array<{ name: string; quantity: number }>>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showCacheMonitor, setShowCacheMonitor] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameType>('paper');

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

  return (
    <div className="min-h-screen p-8 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">MTGV Card Package Builder</h1>
          <p className="text-gray-300">Test the CardInput component</p>
          <button
            onClick={() => setShowCacheMonitor(!showCacheMonitor)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            {showCacheMonitor ? 'Hide' : 'Show'} Cache Monitor
          </button>
        </header>

        <main className="space-y-8">
          {/* Cache Monitor Section */}
          {showCacheMonitor && (
            <section>
              <CacheMonitor />
            </section>
          )}

          {/* Card Input Section */}
          <section className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Add Cards</h2>
            
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
            selectedGame={selectedGame}
            onGameChange={setSelectedGame}
          />
        </main>
      </div>
    </div>
  );
}
