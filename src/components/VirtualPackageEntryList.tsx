import React, { useCallback, useMemo, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { PackageEntry, GameType } from '../types';
import CardVersion from './CardVersion';
import { preloadCardImages, imageCache } from '../lib/imageCache';

interface VirtualPackageEntryListProps {
  entries: PackageEntry[];
  game: GameType;
  onVersionSelection: (oracleId: string, scryfallId: string) => void;
  className?: string;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    entries: PackageEntry[];
    game: GameType;
    onVersionSelection: (oracleId: string, scryfallId: string) => void;
  };
}

const ROW_HEIGHT = 300; // Height for each package entry (card + versions)
const OVERSCAN_COUNT = 3; // Number of items to render outside viewport

const VirtualPackageEntryList: React.FC<VirtualPackageEntryListProps> = ({
  entries,
  game,
  onVersionSelection,
  className = ''
}) => {
  // Preload all card images when entries are loaded
  useEffect(() => {
    if (entries && entries.length > 0) {
      const allPrints = entries
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
  }, [entries]);
  // Memoize the row data to prevent unnecessary re-renders
  const rowData = useMemo(() => ({
    entries,
    game,
    onVersionSelection
  }), [entries, game, onVersionSelection]);

  // Row renderer function
  const Row = useCallback(({ index, style, data }: RowProps) => {
    const entry = data.entries[index];
    
    return (
      <div style={style} className="px-4 py-2">
        <div className="display-entry">
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
                      onSelect={(scryfallId) => data.onVersionSelection(entry.oracle_id!, scryfallId)}
                      cardName={entry.name}
                      gameType={data.game}
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
                  onSelect={(scryfallId) => data.onVersionSelection(entry.oracle_id!, scryfallId)}
                  cardName={entry.name}
                  gameType={data.game}
                />
              </div>
              <div className="display-selected-info">
                <span className="font-medium">Set:</span> {entry.card_prints[0].set_name || 'Unknown Set'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  // Calculate list dimensions
  const listHeight = Math.min(entries.length * ROW_HEIGHT, 600); // Max height of 600px
  const itemCount = entries.length;

  if (entries.length === 0) {
    return (
      <div className={`flex-center text-gray-500 py-8 ${className}`}>
        <p>No cards to display</p>
      </div>
    );
  }

  return (
    <div className={`virtual-card-list ${className}`}>
      <List
        height={listHeight}
        width="100%"
        itemCount={itemCount}
        itemSize={ROW_HEIGHT}
        itemData={rowData}
        overscanCount={OVERSCAN_COUNT}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {Row}
      </List>
    </div>
  );
};

export default VirtualPackageEntryList;
