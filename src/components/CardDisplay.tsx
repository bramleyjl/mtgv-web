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
    <section className="card-display-section">
      <div className="display-header">
        <h2 className="display-title">
          Package Results
        </h2>
        <div className="display-controls">
          <ExportButtons 
            packageId={cardPackage.package_id} 
            disabled={!cardPackage.package_id}
          />
          <button
            onClick={onClearPackage}
            className="display-clear-btn"
          >
            Clear Package
          </button>
        </div>
      </div>
      
      <div className="display-info">
        <p><strong>Game Type:</strong> {cardPackage.game}</p>
        <p><strong>Default Selection:</strong> {cardPackage.default_selection}</p>
        <p><strong>Cards in Package:</strong></p>
      </div>
      
      {cardPackage.package_entries && cardPackage.package_entries.length > 0 ? (
        <div className="space-y-4">
          {cardPackage.package_entries.map((entry, index) => (
            <div key={`${entry.oracle_id || entry.name}-${index}`} className="display-entry">
              <div className="display-entry-header">
                <span className="display-entry-title">
                  {entry.count}x {entry.name}
                </span>
                {entry.not_found && (
                  <span className="display-entry-status">Not Found</span>
                )}
              </div>
              
              {/* Version Selection */}
              {!entry.not_found && entry.card_prints && entry.card_prints.length > 1 && entry.oracle_id && (
                <div className="display-version-section">
                  <p className="display-version-title">Select Version:</p>
                  <div className="display-version-grid">
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
                <div className="display-selected-info">
                  <span className="font-medium">Selected:</span> {entry.card_prints.find(p => p.scryfall_id === entry.selected_print)?.set_name || 'Unknown Set'}
                </div>
              )}
              
              {/* Show single version info */}
              {!entry.not_found && entry.card_prints && entry.card_prints.length === 1 && entry.oracle_id && (
                <div className="display-version-section">
                  <p className="display-version-title">Version:</p>
                  <div className="responsive-single">
                    <CardVersion
                      key={entry.card_prints[0].scryfall_id}
                      print={entry.card_prints[0]}
                      isSelected={true}
                      onSelect={(scryfallId) => onVersionSelection(entry.oracle_id!, scryfallId)}
                      cardName={entry.name}
                      gameType={cardPackage.game}
                    />
                  </div>
                  <div className="display-selected-info">
                    <span className="font-medium">Set:</span> {entry.card_prints[0].set_name || 'Unknown Set'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="display-empty">
          <p className="display-empty-text">No cards found in package</p>
        </div>
      )}
    </section>
  );
} 