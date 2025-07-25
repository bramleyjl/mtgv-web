'use client';

import { GameType } from '@/types';

interface GameSelectorProps {
  selectedGame: GameType;
  onGameChange: (game: GameType) => void;
  className?: string;
}

export default function GameSelector({ selectedGame, onGameChange, className = '' }: GameSelectorProps) {
  const gameOptions: { value: GameType; label: string; description: string }[] = [
    { value: 'paper', label: 'Paper', description: 'Physical card prices' },
    { value: 'mtgo', label: 'MTGO', description: 'Magic Online prices' },
    { value: 'arena', label: 'Arena', description: 'Magic Arena prices' }
  ];

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}>
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">Game Type</h3>
        <p className="text-sm text-gray-400">Select the platform for card pricing</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {gameOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onGameChange(option.value)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
              ${selectedGame === option.value
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }
            `}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Currently selected: <span className="text-blue-400 font-medium">{selectedGame}</span>
      </div>
    </div>
  );
} 