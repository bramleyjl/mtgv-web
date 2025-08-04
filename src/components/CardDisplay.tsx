'use client';

import React from 'react';
import CardVersion from './CardVersion';
import ExportButtons from './ExportButtons';
import { CardPackage } from '@/types';

interface CardDisplayProps {
  cardPackage: CardPackage | null;
  onVersionSelection: (cardName: string, scryfallId: string) => void;
  onClearPackage: () => void;
}

export default function CardDisplay({ 
  cardPackage, 
  onVersionSelection, 
  onClearPackage 
}: CardDisplayProps) {
  if (!cardPackage) {
    return null;
  }

  return (
    <section className="bg-green-900 rounded-lg shadow-lg p-6 border border-green-700">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-green-200">
          Package Results
        </h2>
        <div className="flex items-center gap-3">
          <ExportButtons 
            packageId={cardPackage.package_id} 
            disabled={!cardPackage.package_id}
          />
          <button
            onClick={onClearPackage}
            className="text-green-400 hover:text-green-300 text-sm font-medium"
          >
            Clear Package
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-green-100 mb-4">
        <p><strong>Game Type:</strong> {cardPackage.game}</p>
        <p><strong>Default Selection:</strong> {cardPackage.default_selection}</p>
        <p><strong>Cards in Package:</strong></p>
      </div>
      
      {cardPackage.package_entries && cardPackage.package_entries.length > 0 ? (
        <div className="space-y-4">
          {cardPackage.package_entries.map((entry, index) => (
            <div key={`${entry.oracle_id || entry.name}-${index}`} className="bg-green-800 rounded-lg p-4 border border-green-600">
              <div className="flex justify-between items-start mb-3">
                <span className="font-medium text-green-200 text-lg">
                  {entry.count}x {entry.name}
                </span>
                {entry.not_found && (
                  <span className="text-yellow-300 text-sm bg-yellow-900 px-2 py-1 rounded">Not Found</span>
                )}
              </div>
              
              {/* Version Selection */}
              {!entry.not_found && entry.card_prints && entry.card_prints.length > 1 && entry.oracle_id && (
                <div className="mt-3">
                  <p className="text-sm text-green-300 mb-3 font-medium">Select Version:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {entry.card_prints.map((print) => {
                      const isSelected = entry.selected_print === print.scryfall_id;
                      return (
                        <CardVersion
                          key={print.scryfall_id}
                          print={print}
                          isSelected={isSelected}
                          onSelect={(scryfallId) => onVersionSelection(entry.oracle_id!, scryfallId)}
                          cardName={entry.name}
                          gameType={cardPackage.game}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Show selected version info */}
              {!entry.not_found && entry.selected_print && (
                <div className="mt-3 p-2 bg-green-700 rounded text-sm text-green-200">
                  <span className="font-medium">Selected:</span> {entry.card_prints.find(p => p.scryfall_id === entry.selected_print)?.set_name || 'Unknown Set'}
                </div>
              )}
              
              {/* Show single version info */}
              {!entry.not_found && entry.card_prints && entry.card_prints.length === 1 && entry.oracle_id && (
                <div className="mt-3">
                  <p className="text-sm text-green-300 mb-3 font-medium">Version:</p>
                  <div className="grid grid-cols-1 gap-3">
                    <CardVersion
                      key={entry.card_prints[0].scryfall_id}
                      print={entry.card_prints[0]}
                      isSelected={true}
                      onSelect={(scryfallId) => onVersionSelection(entry.oracle_id!, scryfallId)}
                      cardName={entry.name}
                      gameType={cardPackage.game}
                    />
                  </div>
                  <div className="mt-2 p-2 bg-green-700 rounded text-sm text-green-200">
                    <span className="font-medium">Set:</span> {entry.card_prints[0].set_name || 'Unknown Set'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-yellow-300 text-lg">No cards found in package</p>
        </div>
      )}
    </section>
  );
} 