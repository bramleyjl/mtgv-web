'use client';

import React, { useState } from 'react';
import ErrorDisplay from './ErrorDisplay';
import CardInput from './CardInput';
import CardListTabs, { CardListTab } from './CardListTabs';
import FreeTextInput from './FreeTextInput';
import ImportUrlInput from './ImportUrlInput';
import { GameType, DefaultSelection, Card } from '@/types';

interface CardListProps {
  cards: { name: string; quantity: number }[];
  onAddCard: (cardName: string, quantity: number) => void;
  onAddCardToPackage?: (cardName: string, quantity?: number, game?: GameType, defaultSelection?: DefaultSelection) => Promise<void>;
  validateCardList: (cards: Array<{ name: string; quantity: number }>) => { isValid: boolean; error?: string; totalCards?: number };
  selectedGame: GameType;
  selectedDefaultSelection: DefaultSelection;
  onPasteCards: (cards: Array<{ name: string; quantity: number }>) => void;
  onCreatePackageFromCards: (cards: Array<{ name: string; count: number }>) => void;
  packageCardList?: Card[] | null;
  error: string | null;
  clearError: () => void;
}

export default function CardList({
  cards,
  onAddCard,
  onAddCardToPackage,
  validateCardList,
  selectedGame,
  selectedDefaultSelection,
  onPasteCards,
  onCreatePackageFromCards,
  packageCardList,
  error,
  clearError
}: CardListProps) {

  const [activeTab, setActiveTab] = useState<CardListTab>('manual');

  return (
    <section className="card-list-section">

      {/* Tabbed Interface */}
      <CardListTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'manual' && (
        <>
          {/* Error Display */}
          <ErrorDisplay
            error={error}
            onDismiss={clearError}
            type="error"
          />

          {/* Card Input Section */}
          <section className="card-input-section mb-medium">
            <CardInput
              onAddCard={(cardName, quantity) => {
                // Use hybrid approach: if onAddCardToPackage is available, use it
                if (onAddCardToPackage) {
                  onAddCardToPackage(cardName, quantity, selectedGame, selectedDefaultSelection);
                } else {
                  // Fallback to local state update
                  onAddCard(cardName, quantity);
                }
              }}
              currentCards={cards}
              validateCardList={validateCardList}
            />
          </section>
        </>
      )}

      {activeTab === 'freeText' && (
        <FreeTextInput
          onImportCards={onPasteCards}
          onCreatePackage={onCreatePackageFromCards}
          cardList={packageCardList ?? null}
        />
      )}

      {activeTab === 'importUrl' && (
        <ImportUrlInput />
      )}
    </section>
  );
}
