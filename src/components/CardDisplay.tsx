'use client';

import React, { useEffect, useState } from 'react';
import VirtualPackageEntryList from './VirtualPackageEntryList';
import CardVersion from './CardVersion';
import { CardPackage } from '@/types';
import { preloadCardImages, imageCache } from '@/lib/imageCache';

interface CardDisplayProps {
  cardPackage: CardPackage | null;
  onVersionSelection: (cardName: string, scryfallId: string) => void;
  onUpdateQuantity: (cardName: string, newQuantity: number) => void;
  onRemoveCard: (cardName: string) => void;
}

export default function CardDisplay({
  cardPackage,
  onVersionSelection,
  onUpdateQuantity,
  onRemoveCard
}: CardDisplayProps) {
  const [collapsedEntries, setCollapsedEntries] = useState<Set<string>>(new Set());
  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: string }>({});

  // Preload all card images when package is loaded
  useEffect(() => {
    if (cardPackage?.package_entries) {
      const allPrints = cardPackage.package_entries
        .filter(entry => entry.card_prints)
        .flatMap(entry => entry.card_prints || []);

      if (allPrints.length > 0) {
        // Only preload images that aren't already cached
        const uncachedPrints = allPrints.filter(print => {
          const imageUrl = print.image_url || print.image_uris?.[0]?.normal;
          return imageUrl && !imageCache.has(imageUrl);
        });

        if (uncachedPrints.length > 0) {
          preloadCardImages(uncachedPrints, 'medium');
        }
      }
    }
  }, [cardPackage?.package_entries]);

  if (!cardPackage) {
    return null;
  }

  const toggleCollapse = (cardName: string) => {
    setCollapsedEntries(prev => {
      const next = new Set(prev);
      if (next.has(cardName)) {
        next.delete(cardName);
      } else {
        next.add(cardName);
      }
      return next;
    });
  };

  const handleQuantityChange = (cardName: string, value: string) => {
    setEditingQuantity(prev => ({ ...prev, [cardName]: value }));
  };

  const handleQuantityBlur = (cardName: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 100) {
      onUpdateQuantity(cardName, numValue);
    }
    setEditingQuantity(prev => {
      const next = { ...prev };
      delete next[cardName];
      return next;
    });
  };

  const handleIncreaseQuantity = (cardName: string, currentQuantity: number) => {
    if (currentQuantity < 100) {
      onUpdateQuantity(cardName, currentQuantity + 1);
    }
  };

  const handleDecreaseQuantity = (cardName: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      onUpdateQuantity(cardName, currentQuantity - 1);
    }
  };

  const getDisplayQuantity = (cardName: string, count: number): string | number => {
    return editingQuantity[cardName] !== undefined ? editingQuantity[cardName] : count;
  };

  return (
    <section className="card-display-section">
      {cardPackage.package_entries && cardPackage.package_entries.length > 0 ? (
        <>
          {/* Use virtual scrolling for large lists (25+ entries) - only when it's beneficial */}
          {cardPackage.package_entries.length >= 25 ? (
            <VirtualPackageEntryList
              entries={cardPackage.package_entries}
              game={cardPackage.game}
              onVersionSelection={onVersionSelection}
            />
          ) : (
            /* Regular rendering for smaller lists */
            <div className="gap-medium">
              {cardPackage.package_entries.map((entry, index) => {
                const isCollapsed = collapsedEntries.has(entry.name);
                const displayQuantity = getDisplayQuantity(entry.name, entry.count);

                // Get the selected set name
                const selectedSetName = !entry.not_found && entry.selected_print && entry.card_prints
                  ? entry.card_prints.find(p => p.scryfall_id === entry.selected_print)?.set_name
                  : null;

                return (
                  <div key={`${entry.oracle_id || entry.name}-${index}`} className="display-entry">
                    <div className="display-entry-header-row">
                      {/* Left: Card name and collapse button */}
                      <div className="display-entry-header-left">
                        <button
                          onClick={() => toggleCollapse(entry.name)}
                          className="btn-collapse"
                          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={isCollapsed ? "M9 5l7 7-7 7" : "M19 9l-7 7-7-7"}
                            />
                          </svg>
                        </button>
                        <div className="display-entry-title-container">
                          <span className="display-entry-title">
                            {entry.name}
                          </span>
                          {selectedSetName && (
                            <span className="display-entry-set">
                              {selectedSetName}
                            </span>
                          )}
                        </div>
                        {entry.not_found && (
                          <span className="display-entry-status">Not Found</span>
                        )}
                      </div>

                      {/* Right: Quantity controls and remove button */}
                      <div className="display-entry-controls">
                        <div className="quantity-controls">
                          <button
                            onClick={() => handleDecreaseQuantity(entry.name, entry.count)}
                            disabled={entry.count <= 1}
                            className="btn-quantity"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>

                          <input
                            type="number"
                            value={displayQuantity}
                            onChange={(e) => handleQuantityChange(entry.name, e.target.value)}
                            onBlur={(e) => handleQuantityBlur(entry.name, e.target.value)}
                            min="1"
                            max="100"
                            className="input-field"
                          />

                          <button
                            onClick={() => handleIncreaseQuantity(entry.name, entry.count)}
                            disabled={entry.count >= 100}
                            className="btn-quantity"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveCard(entry.name)}
                          className="btn-remove"
                          aria-label="Remove card"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Collapsible content */}
                    {!isCollapsed && (
                      <>
                        {/* Version Selection */}
                        {!entry.not_found && entry.card_prints && entry.card_prints.length > 1 && entry.oracle_id && (
                          <div className="display-version-section">
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
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="display-empty">
          <p className="display-empty-text">No cards found in package</p>
        </div>
      )}
    </section>
  );
}
