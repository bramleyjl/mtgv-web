'use client';

import React, { useState, useCallback } from 'react';
import CardVersion from './CardVersion';
import { CardPackage, PackageEntry } from '@/types';

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
  const [openVersionBrowsers, setOpenVersionBrowsers] = useState<Set<string>>(new Set());
  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: string }>({});

  const toggleCollapse = useCallback((cardName: string) => {
    setCollapsedEntries(prev => {
      const next = new Set(prev);
      if (next.has(cardName)) {
        next.delete(cardName);
      } else {
        next.add(cardName);
      }
      return next;
    });
  }, []);

  const toggleVersionBrowser = useCallback((oracleId: string) => {
    setOpenVersionBrowsers(prev => {
      const next = new Set(prev);
      if (next.has(oracleId)) {
        next.delete(oracleId);
      } else {
        next.add(oracleId);
      }
      return next;
    });
  }, []);

  const handleVersionSelect = useCallback((oracleId: string, scryfallId: string) => {
    onVersionSelection(oracleId, scryfallId);
    // Auto-close the browser after selection
    setOpenVersionBrowsers(prev => {
      const next = new Set(prev);
      next.delete(oracleId);
      return next;
    });
  }, [onVersionSelection]);

  const handleQuantityChange = useCallback((cardName: string, value: string) => {
    setEditingQuantity(prev => ({ ...prev, [cardName]: value }));
  }, []);

  const handleQuantityBlur = useCallback((cardName: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 100) {
      onUpdateQuantity(cardName, numValue);
    }
    setEditingQuantity(prev => {
      const next = { ...prev };
      delete next[cardName];
      return next;
    });
  }, [onUpdateQuantity]);

  const handleIncreaseQuantity = useCallback((cardName: string, currentQuantity: number) => {
    if (currentQuantity < 100) {
      onUpdateQuantity(cardName, currentQuantity + 1);
    }
  }, [onUpdateQuantity]);

  const handleDecreaseQuantity = useCallback((cardName: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      onUpdateQuantity(cardName, currentQuantity - 1);
    }
  }, [onUpdateQuantity]);

  const getDisplayQuantity = (cardName: string, count: number): string | number => {
    return editingQuantity[cardName] !== undefined ? editingQuantity[cardName] : count;
  };

  if (!cardPackage) {
    return null;
  }

  return (
    <section className="card-display-section">
      {cardPackage.package_entries && cardPackage.package_entries.length > 0 ? (
        <div className="gap-medium">
          {cardPackage.package_entries.map((entry: PackageEntry, index: number) => {
            const isCollapsed = collapsedEntries.has(entry.name);
            const isBrowserOpen = entry.oracle_id ? openVersionBrowsers.has(entry.oracle_id) : false;
            const displayQuantity = getDisplayQuantity(entry.name, entry.count);

            const selectedPrint = entry.selected_print && entry.card_prints
              ? entry.card_prints.find(p => p.scryfall_id === entry.selected_print)
              : null;
            const selectedSetName = selectedPrint?.set_name ?? null;
            const printCount = entry.card_prints?.length ?? 0;

            return (
              <div key={`${entry.oracle_id || entry.name}-${index}`} className="display-entry">
                {/* Entry header row */}
                <div className="display-entry-header-row">
                  {/* Left: collapse toggle + card name + set */}
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
                      <span className="display-entry-title">{entry.name}</span>
                      {selectedSetName && (
                        <span className="display-entry-set">{selectedSetName}</span>
                      )}
                    </div>
                    {!entry.oracle_id && (
                      <span className="display-entry-status">Not Found</span>
                    )}
                  </div>

                  {/* Right: quantity controls + remove */}
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
                {!isCollapsed && entry.oracle_id && entry.card_prints && (
                  <div className="display-version-section">
                    {/* Selected print */}
                    {selectedPrint && (
                      <div className="display-selected-print">
                        <CardVersion
                          print={selectedPrint}
                          isSelected={true}
                          onSelect={(scryfallId) => handleVersionSelect(entry.oracle_id!, scryfallId)}
                          cardName={entry.name}
                          gameType={cardPackage.game}
                        />
                      </div>
                    )}

                    {/* Browse versions button — only show when there are multiple prints */}
                    {printCount > 1 && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleVersionBrowser(entry.oracle_id!)}
                          className="btn-browse-versions"
                        >
                          {isBrowserOpen
                            ? 'Hide versions'
                            : `Browse ${printCount} versions`}
                        </button>
                      </div>
                    )}

                    {/* Expandable version grid — lazy rendered */}
                    {isBrowserOpen && (
                      <div className="display-version-grid mt-3">
                        {entry.card_prints.map((print) => {
                          const isSelected = entry.selected_print === print.scryfall_id;
                          return (
                            <CardVersion
                              key={print.scryfall_id}
                              print={print}
                              isSelected={isSelected}
                              onSelect={(scryfallId) => handleVersionSelect(entry.oracle_id!, scryfallId)}
                              cardName={entry.name}
                              gameType={cardPackage.game}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="display-empty">
          <p className="display-empty-text">No cards found in package</p>
        </div>
      )}
    </section>
  );
}
