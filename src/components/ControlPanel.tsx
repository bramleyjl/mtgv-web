'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GameType, DefaultSelection } from '@/types';
import { useExport } from '@/hooks/useExport';

interface ControlPanelProps {
  selectedGame: GameType;
  onGameChange: (game: GameType) => void;
  selectedDefaultSelection: DefaultSelection;
  onDefaultSelectionChange: (selection: DefaultSelection) => void;
  cardCount: number;
  maxCards: number;
  packageId?: string | undefined;
  onClearPackage: () => void;
  hasPackage: boolean;
}

export default function ControlPanel({
  selectedGame,
  onGameChange,
  selectedDefaultSelection,
  onDefaultSelectionChange,
  cardCount,
  maxCards,
  packageId,
  onClearPackage,
  hasPackage
}: ControlPanelProps) {
  const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const gameDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const { exportLoading, exportTCGPlayer, exportText } = useExport();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gameDropdownRef.current && !gameDropdownRef.current.contains(event.target as Node)) {
        setIsGameDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGameSelect = (game: GameType) => {
    onGameChange(game);
    setIsGameDropdownOpen(false);
  };

  const handleSortSelect = (selection: DefaultSelection) => {
    onDefaultSelectionChange(selection);
    setIsSortDropdownOpen(false);
  };

  const handleExport = async (type: 'tcgplayer' | 'text') => {
    if (!packageId) return;

    if (type === 'tcgplayer') {
      await exportTCGPlayer(packageId);
    } else {
      await exportText(packageId);
    }
    setIsExportDropdownOpen(false);
  };

  const gameLabels = {
    paper: 'Paper',
    mtgo: 'MTGO',
    arena: 'Arena'
  };

  const sortLabels = {
    newest: 'Newest',
    oldest: 'Oldest',
    least_expensive: 'Least Expensive',
    most_expensive: 'Most Expensive'
  };

  return (
    <div className="control-panel">
      <div className="control-panel-content">
        {/* Left Section: Title */}
        <div className="control-panel-title">
          <h1>MTGV</h1>
        </div>

        {/* Center Section: Controls */}
        <div className="control-panel-controls">
          {/* Game Dropdown */}
          <div className="dropdown" ref={gameDropdownRef}>
            <button
              onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)}
              className="dropdown-button"
            >
              <span className="dropdown-label">Game:</span>
              <span className="dropdown-value">{gameLabels[selectedGame]}</span>
              <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isGameDropdownOpen && (
              <div className="dropdown-menu">
                <button
                  onClick={() => handleGameSelect('paper')}
                  className={`dropdown-item ${selectedGame === 'paper' ? 'dropdown-item-active' : ''}`}
                >
                  Paper
                </button>
                <button
                  onClick={() => handleGameSelect('mtgo')}
                  className={`dropdown-item ${selectedGame === 'mtgo' ? 'dropdown-item-active' : ''}`}
                >
                  MTGO
                </button>
                <button
                  onClick={() => handleGameSelect('arena')}
                  className={`dropdown-item ${selectedGame === 'arena' ? 'dropdown-item-active' : ''}`}
                >
                  Arena
                </button>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="dropdown" ref={sortDropdownRef}>
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="dropdown-button"
            >
              <span className="dropdown-label">Sort:</span>
              <span className="dropdown-value">{sortLabels[selectedDefaultSelection]}</span>
              <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isSortDropdownOpen && (
              <div className="dropdown-menu">
                <button
                  onClick={() => handleSortSelect('newest')}
                  className={`dropdown-item ${selectedDefaultSelection === 'newest' ? 'dropdown-item-active' : ''}`}
                >
                  Newest
                </button>
                <button
                  onClick={() => handleSortSelect('oldest')}
                  className={`dropdown-item ${selectedDefaultSelection === 'oldest' ? 'dropdown-item-active' : ''}`}
                >
                  Oldest
                </button>
                <button
                  onClick={() => handleSortSelect('least_expensive')}
                  className={`dropdown-item ${selectedDefaultSelection === 'least_expensive' ? 'dropdown-item-active' : ''}`}
                >
                  Least Expensive
                </button>
                <button
                  onClick={() => handleSortSelect('most_expensive')}
                  className={`dropdown-item ${selectedDefaultSelection === 'most_expensive' ? 'dropdown-item-active' : ''}`}
                >
                  Most Expensive
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Card Counter & Actions */}
        <div className="control-panel-actions">
          <div className="card-counter">
            <span className={`card-count ${cardCount >= maxCards ? 'card-count-max' : ''}`}>
              {cardCount}/{maxCards}
            </span>
          </div>

          {hasPackage && (
            <>
              {/* Export Dropdown */}
              <div className="dropdown" ref={exportDropdownRef}>
                <button
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  disabled={!packageId || exportLoading}
                  className="btn-dropdown-primary"
                >
                  {exportLoading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      Export
                      <svg className="dropdown-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                {isExportDropdownOpen && !exportLoading && (
                  <div className="dropdown-menu dropdown-menu-right">
                    <button
                      onClick={() => handleExport('tcgplayer')}
                      className="dropdown-item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Export to TCGPlayer
                    </button>
                    <button
                      onClick={() => handleExport('text')}
                      className="dropdown-item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Copy as Text
                    </button>
                  </div>
                )}
              </div>

              {/* Clear Button */}
              <button
                onClick={onClearPackage}
                className="btn-icon-danger"
                title="Clear package"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}

          {/* Scroll to Top Button */}
          <button
            onClick={scrollToTop}
            className="btn-icon-secondary"
            title="Scroll to top"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
