'use client';

import React from 'react';
import { GameType } from '@/types';

interface GameSelectorProps {
  selectedGame: GameType;
  onGameChange: (game: GameType) => void;
}

export default function GameSelector({ selectedGame, onGameChange }: GameSelectorProps) {
  return (
    <div className="card-section">
      <div className="mb-medium">
        <h3 className="text-heading-small">Game Type</h3>
        <p className="text-body-small text-body-muted">Select the platform for card pricing</p>
      </div>
      
      <div className="flex-center gap-small">
        <button
          onClick={() => onGameChange('paper')}
          className={`btn-game ${
            selectedGame === 'paper'
              ? 'btn-game-active'
              : 'btn-game-inactive'
          }`}
        >
          Paper
        </button>
        <button
          onClick={() => onGameChange('mtgo')}
          className={`btn-game ${
            selectedGame === 'mtgo'
              ? 'btn-game-active'
              : 'btn-game-inactive'
          }`}
        >
          MTGO
        </button>
        <button
          onClick={() => onGameChange('arena')}
          className={`btn-game ${
            selectedGame === 'arena'
              ? 'btn-game-active'
              : 'btn-game-inactive'
          }`}
        >
          Arena
        </button>
      </div>
      
      <div className="mt-small text-body-xs text-body-muted">
        Currently selected: <span className="text-info font-medium">{selectedGame}</span>
      </div>
    </div>
  );
} 