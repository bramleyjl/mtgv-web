import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardDisplay from './CardDisplay';
import { CardPackage, PackageEntry } from '@/types';

// Mock CardVersion component
jest.mock('./CardVersion', () => {
  return function MockCardVersion({ print, isSelected, onSelect, cardName, gameType }: {
    print: { scryfall_id: string; set_name?: string; collector_number?: string };
    isSelected: boolean;
    onSelect: (scryfallId: string) => void;
    cardName: string;
    gameType: string;
  }) {
    return (
      <div
        data-testid="card-version"
        data-scryfall-id={print.scryfall_id}
        data-is-selected={isSelected}
        data-card-name={cardName}
        data-game-type={gameType}
        onClick={() => onSelect(print.scryfall_id)}
      >
        {print.set_name || 'Unknown Set'} - {print.collector_number || 'N/A'}
        {isSelected && <span data-testid="selected-indicator">✓</span>}
      </div>
    );
  };
});

describe('CardDisplay', () => {
  const mockPackageEntry: PackageEntry = {
    count: 2,
    oracle_id: 'test-oracle-id',
    name: 'Lightning Bolt',
    card_prints: [
      {
        scryfall_id: 'print-1',
        count: 1,
        set_name: 'Magic 2010',
        collector_number: '133',
        price: 2.50,
        image_uris: [{ normal: 'https://api.scryfall.com/cards/test1.jpg' }]
      },
      {
        scryfall_id: 'print-2',
        count: 1,
        set_name: 'Magic 2011',
        collector_number: '134',
        price: 3.00,
        image_uris: [{ normal: 'https://api.scryfall.com/cards/test2.jpg' }]
      }
    ],
    selected_print: 'print-1',
    user_selected: true
  };

  const mockCardPackage: CardPackage = {
    package_id: 'test-package-id',
    card_list: [{ name: 'Lightning Bolt', count: 2 }],
    game: 'paper',
    package_entries: [mockPackageEntry],
    default_selection: 'newest'
  };

  const defaultProps = {
    cardPackage: mockCardPackage,
    onVersionSelection: jest.fn(),
    onUpdateQuantity: jest.fn(),
    onRemoveCard: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render package entries correctly', () => {
      render(<CardDisplay {...defaultProps} />);

      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    });

    it('should show only the selected print by default', () => {
      render(<CardDisplay {...defaultProps} />);

      // Only the selected print is rendered by default
      const cardVersions = screen.getAllByTestId('card-version');
      expect(cardVersions).toHaveLength(1);
      expect(cardVersions[0]).toHaveAttribute('data-scryfall-id', 'print-1');
    });

    it('should show the selected set name in the entry header', () => {
      render(<CardDisplay {...defaultProps} />);

      // Selected print set name shown in header
      expect(screen.getByText('Magic 2010')).toBeInTheDocument();
    });

    it('should show "Browse N versions" button for multiple prints', () => {
      render(<CardDisplay {...defaultProps} />);

      expect(screen.getByText('Browse 2 versions')).toBeInTheDocument();
    });

    it('should not show a browse button for single print', () => {
      const singlePrintEntry: PackageEntry = {
        ...mockPackageEntry,
        card_prints: [mockPackageEntry.card_prints[0]]
      };
      render(<CardDisplay {...defaultProps} cardPackage={{ ...mockCardPackage, package_entries: [singlePrintEntry] }} />);

      expect(screen.queryByText(/Browse/)).not.toBeInTheDocument();
    });

    it('should show all prints in grid after clicking browse button', () => {
      render(<CardDisplay {...defaultProps} />);

      fireEvent.click(screen.getByText('Browse 2 versions'));

      // Now selected print (1) + all prints in grid (2) = 3 total
      const cardVersions = screen.getAllByTestId('card-version');
      expect(cardVersions).toHaveLength(3);
    });

    it('should handle cards with no prints', () => {
      const noPrintsEntry: PackageEntry = { ...mockPackageEntry, card_prints: [] };
      render(<CardDisplay {...defaultProps} cardPackage={{ ...mockCardPackage, package_entries: [noPrintsEntry] }} />);

      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      expect(screen.queryByTestId('card-version')).not.toBeInTheDocument();
    });

    it('should handle not found cards', () => {
      const notFoundEntry: PackageEntry = { ...mockPackageEntry, oracle_id: null, selected_print: null };
      render(<CardDisplay {...defaultProps} cardPackage={{ ...mockCardPackage, package_entries: [notFoundEntry] }} />);

      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });

    it('should render empty package message when no entries', () => {
      render(<CardDisplay {...defaultProps} cardPackage={{ ...mockCardPackage, package_entries: [] }} />);

      expect(screen.getByText('No cards found in package')).toBeInTheDocument();
    });

    it('should not render when cardPackage is null', () => {
      render(<CardDisplay {...defaultProps} cardPackage={null} />);

      expect(screen.queryByText('Package Results')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onVersionSelection when selected print is clicked', () => {
      const mockOnVersionSelection = jest.fn();
      render(<CardDisplay {...defaultProps} onVersionSelection={mockOnVersionSelection} />);

      const cardVersions = screen.getAllByTestId('card-version');
      fireEvent.click(cardVersions[0]);

      expect(mockOnVersionSelection).toHaveBeenCalledWith('test-oracle-id', 'print-1');
    });

    it('should call onVersionSelection when a print in the browse grid is clicked', () => {
      const mockOnVersionSelection = jest.fn();
      render(<CardDisplay {...defaultProps} onVersionSelection={mockOnVersionSelection} />);

      // Open the browser
      fireEvent.click(screen.getByText('Browse 2 versions'));

      // cardVersions[0] = selected print section, [1] = print-1 in grid, [2] = print-2 in grid
      const cardVersions = screen.getAllByTestId('card-version');
      fireEvent.click(cardVersions[2]); // Click print-2 in the grid

      expect(mockOnVersionSelection).toHaveBeenCalledWith('test-oracle-id', 'print-2');
    });

    it('should close the browse panel after selecting a version', () => {
      render(<CardDisplay {...defaultProps} />);

      fireEvent.click(screen.getByText('Browse 2 versions'));
      expect(screen.getByText('Hide versions')).toBeInTheDocument();

      // Click a version in the grid
      const cardVersions = screen.getAllByTestId('card-version');
      fireEvent.click(cardVersions[2]);

      // Browser should close
      expect(screen.queryByText('Hide versions')).not.toBeInTheDocument();
      expect(screen.getByText('Browse 2 versions')).toBeInTheDocument();
    });

    it('should toggle browse panel open and closed', () => {
      render(<CardDisplay {...defaultProps} />);

      fireEvent.click(screen.getByText('Browse 2 versions'));
      expect(screen.getByText('Hide versions')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Hide versions'));
      expect(screen.getByText('Browse 2 versions')).toBeInTheDocument();
    });

    it('should pass correct props to selected CardVersion', () => {
      render(<CardDisplay {...defaultProps} />);

      const cardVersion = screen.getByTestId('card-version');
      expect(cardVersion).toHaveAttribute('data-card-name', 'Lightning Bolt');
      expect(cardVersion).toHaveAttribute('data-game-type', 'paper');
      expect(cardVersion).toHaveAttribute('data-is-selected', 'true');
    });
  });

  describe('Selection State', () => {
    it('should show selected version indicator', () => {
      render(<CardDisplay {...defaultProps} />);

      expect(screen.getByTestId('selected-indicator')).toBeInTheDocument();
    });

    it('should mark correct version as selected', () => {
      render(<CardDisplay {...defaultProps} />);

      const cardVersion = screen.getByTestId('card-version');
      expect(cardVersion).toHaveAttribute('data-scryfall-id', 'print-1');
      expect(cardVersion).toHaveAttribute('data-is-selected', 'true');
    });

    it('should handle no selected print — no CardVersion shown by default', () => {
      const noSelectionEntry: PackageEntry = { ...mockPackageEntry, selected_print: null };
      render(<CardDisplay {...defaultProps} cardPackage={{ ...mockCardPackage, package_entries: [noSelectionEntry] }} />);

      // No selected print, so no CardVersion rendered by default
      expect(screen.queryByTestId('card-version')).not.toBeInTheDocument();
      // Browse button still present
      expect(screen.getByText('Browse 2 versions')).toBeInTheDocument();
    });

    it('should show all unselected versions in browse grid when no print is selected', () => {
      const noSelectionEntry: PackageEntry = { ...mockPackageEntry, selected_print: null };
      render(<CardDisplay {...defaultProps} cardPackage={{ ...mockCardPackage, package_entries: [noSelectionEntry] }} />);

      fireEvent.click(screen.getByText('Browse 2 versions'));

      const cardVersions = screen.getAllByTestId('card-version');
      cardVersions.forEach(version => {
        expect(version).toHaveAttribute('data-is-selected', 'false');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing oracle_id — no version UI shown', () => {
      const noOracleEntry: PackageEntry = { ...mockPackageEntry, oracle_id: null };
      render(<CardDisplay {...defaultProps} cardPackage={{ ...mockCardPackage, package_entries: [noOracleEntry] }} />);

      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      expect(screen.queryByTestId('card-version')).not.toBeInTheDocument();
    });

    it('should handle multiple package entries', () => {
      const secondEntry: PackageEntry = {
        count: 1,
        oracle_id: 'test-oracle-id-2',
        name: 'Counterspell',
        card_prints: [{
          scryfall_id: 'print-3',
          count: 1,
          set_name: 'Magic 2012',
          collector_number: '135',
          price: 1.50,
          image_uris: [{ normal: 'https://api.scryfall.com/cards/test3.jpg' }]
        }],
        selected_print: 'print-3',
        user_selected: false
      };

      render(<CardDisplay {...defaultProps} cardPackage={{ ...mockCardPackage, package_entries: [mockPackageEntry, secondEntry] }} />);

      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      expect(screen.getByText('Counterspell')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have correct container styling', () => {
      render(<CardDisplay {...defaultProps} />);

      expect(document.querySelector('.card-display-section')).toBeInTheDocument();
    });

    it('should have correct card entry styling', () => {
      render(<CardDisplay {...defaultProps} />);

      const displayEntry = document.querySelector('.display-entry');
      expect(displayEntry).toBeInTheDocument();
      expect(displayEntry).toHaveClass('display-entry');
    });

    it('should show version grid inside version section after browse is opened', () => {
      render(<CardDisplay {...defaultProps} />);

      fireEvent.click(screen.getByText('Browse 2 versions'));

      const versionSection = document.querySelector('.display-version-section');
      expect(versionSection).toBeInTheDocument();
      const versionGrid = versionSection?.querySelector('.display-version-grid');
      expect(versionGrid).toBeInTheDocument();
    });
  });
});
