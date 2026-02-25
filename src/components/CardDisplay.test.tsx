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

      // Card name is displayed without quantity prefix now
      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      // Quantity is in a separate input
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    });

    it('should render CardVersion components for each print', () => {
      render(<CardDisplay {...defaultProps} />);

      const cardVersions = screen.getAllByTestId('card-version');
      expect(cardVersions).toHaveLength(2);

      expect(cardVersions[0]).toHaveAttribute('data-scryfall-id', 'print-1');
      expect(cardVersions[1]).toHaveAttribute('data-scryfall-id', 'print-2');
    });

    it('should show selected version information', () => {
      render(<CardDisplay {...defaultProps} />);

      expect(screen.getByText(/Selected:/)).toBeInTheDocument();
      // Magic 2010 appears in multiple places (card version and selected info)
      expect(screen.getAllByText('Magic 2010').length).toBeGreaterThan(0);
    });

    it('should render single version correctly', () => {
      const singlePrintEntry: PackageEntry = {
        ...mockPackageEntry,
        card_prints: [mockPackageEntry.card_prints[0]]
      };

      const singlePrintPackage: CardPackage = {
        ...mockCardPackage,
        package_entries: [singlePrintEntry]
      };

      render(<CardDisplay {...defaultProps} cardPackage={singlePrintPackage} />);

      expect(screen.getByText(/Set:/)).toBeInTheDocument();
      // Check that Magic 2010 appears in the Set section specifically
      const setSection = screen.getByText(/Set:/).closest('div');
      expect(setSection).toHaveTextContent('Magic 2010');
    });

    it('should handle cards with no prints', () => {
      const noPrintsEntry: PackageEntry = {
        ...mockPackageEntry,
        card_prints: []
      };

      const noPrintsPackage: CardPackage = {
        ...mockCardPackage,
        package_entries: [noPrintsEntry]
      };

      render(<CardDisplay {...defaultProps} cardPackage={noPrintsPackage} />);

      // Card name is displayed
      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      // Quantity is shown in input
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
      // No version info shown for cards with no prints
      expect(screen.queryByText(/Set:/)).not.toBeInTheDocument();
    });

    it('should handle cards with single print', () => {
      const singlePrintEntry: PackageEntry = {
        ...mockPackageEntry,
        card_prints: [mockPackageEntry.card_prints[0]]
      };

      const singlePrintPackage: CardPackage = {
        ...mockCardPackage,
        package_entries: [singlePrintEntry]
      };

      render(<CardDisplay {...defaultProps} cardPackage={singlePrintPackage} />);

      // For single print, we show "Set:" label
      expect(screen.getByText(/Set:/)).toBeInTheDocument();
      // No version selector needed for single prints (they auto-select)
    });

    it('should handle cards with multiple prints', () => {
      render(<CardDisplay {...defaultProps} />);

      // For multiple prints, we show the card versions in a grid
      const cardVersions = screen.queryAllByTestId('card-version');
      expect(cardVersions.length).toBeGreaterThan(1);
    });

    it('should handle not found cards', () => {
      const notFoundEntry: PackageEntry = {
        ...mockPackageEntry,
        not_found: true
      };

      const notFoundPackage: CardPackage = {
        ...mockCardPackage,
        package_entries: [notFoundEntry]
      };

      render(<CardDisplay {...defaultProps} cardPackage={notFoundPackage} />);

      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });

    it('should render empty package message when no entries', () => {
      const emptyPackage: CardPackage = {
        ...mockCardPackage,
        package_entries: []
      };

      render(<CardDisplay {...defaultProps} cardPackage={emptyPackage} />);

      expect(screen.getByText('No cards found in package')).toBeInTheDocument();
    });

    it('should not render when cardPackage is null', () => {
      render(<CardDisplay {...defaultProps} cardPackage={null} />);

      expect(screen.queryByText('Package Results')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onVersionSelection when a card version is selected', () => {
      const mockOnVersionSelection = jest.fn();
      render(<CardDisplay {...defaultProps} onVersionSelection={mockOnVersionSelection} />);

      const cardVersions = screen.getAllByTestId('card-version');
      fireEvent.click(cardVersions[1]); // Click second version

      expect(mockOnVersionSelection).toHaveBeenCalledWith('test-oracle-id', 'print-2');
    });

    it('should pass correct props to CardVersion components', () => {
      render(<CardDisplay {...defaultProps} />);

      const cardVersions = screen.getAllByTestId('card-version');

      expect(cardVersions[0]).toHaveAttribute('data-card-name', 'Lightning Bolt');
      expect(cardVersions[0]).toHaveAttribute('data-game-type', 'paper');
      expect(cardVersions[0]).toHaveAttribute('data-is-selected', 'true');

      expect(cardVersions[1]).toHaveAttribute('data-is-selected', 'false');
    });
  });

  describe('Selection State', () => {
    it('should show selected version indicator', () => {
      render(<CardDisplay {...defaultProps} />);

      const selectedIndicator = screen.getByTestId('selected-indicator');
      expect(selectedIndicator).toBeInTheDocument();
    });

    it('should mark correct version as selected', () => {
      render(<CardDisplay {...defaultProps} />);

      const cardVersions = screen.getAllByTestId('card-version');
      const selectedVersion = cardVersions.find(version =>
        version.getAttribute('data-is-selected') === 'true'
      );

      expect(selectedVersion).toHaveAttribute('data-scryfall-id', 'print-1');
    });

    it('should handle no selected print', () => {
      const noSelectionEntry: PackageEntry = {
        ...mockPackageEntry,
        selected_print: null
      };

      const noSelectionPackage: CardPackage = {
        ...mockCardPackage,
        package_entries: [noSelectionEntry]
      };

      render(<CardDisplay {...defaultProps} cardPackage={noSelectionPackage} />);

      const cardVersions = screen.getAllByTestId('card-version');
      cardVersions.forEach(version => {
        expect(version).toHaveAttribute('data-is-selected', 'false');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing oracle_id', () => {
      const noOracleEntry: PackageEntry = {
        ...mockPackageEntry,
        oracle_id: null
      };

      const noOraclePackage: CardPackage = {
        ...mockCardPackage,
        package_entries: [noOracleEntry]
      };

      render(<CardDisplay {...defaultProps} cardPackage={noOraclePackage} />);

      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      // No version selection shown when oracle_id is null
      expect(screen.queryByText(/Set:/)).not.toBeInTheDocument();
    });

    it('should handle missing selected_print in single version', () => {
      const singlePrintEntry: PackageEntry = {
        ...mockPackageEntry,
        card_prints: [mockPackageEntry.card_prints[0]],
        selected_print: null
      };

      const singlePrintPackage: CardPackage = {
        ...mockCardPackage,
        package_entries: [singlePrintEntry]
      };

      render(<CardDisplay {...defaultProps} cardPackage={singlePrintPackage} />);

      expect(screen.getByText(/Set:/)).toBeInTheDocument();
      // Check that Magic 2010 appears in the Set section specifically
      const setSection = screen.getByText(/Set:/).closest('div');
      expect(setSection).toHaveTextContent('Magic 2010');
    });

    it('should handle multiple package entries', () => {
      const secondEntry: PackageEntry = {
        count: 1,
        oracle_id: 'test-oracle-id-2',
        name: 'Counterspell',
        card_prints: [
          {
            scryfall_id: 'print-3',
            count: 1,
            set_name: 'Magic 2012',
            collector_number: '135',
            price: 1.50,
            image_uris: [{ normal: 'https://api.scryfall.com/cards/test3.jpg' }]
          }
        ],
        selected_print: 'print-3',
        user_selected: false
      };

      const multiEntryPackage: CardPackage = {
        ...mockCardPackage,
        package_entries: [mockPackageEntry, secondEntry]
      };

      render(<CardDisplay {...defaultProps} cardPackage={multiEntryPackage} />);

      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      expect(screen.getByText('Counterspell')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have correct container styling', () => {
      render(<CardDisplay {...defaultProps} />);

      const container = document.querySelector('.card-display-section');
      expect(container).toBeInTheDocument();
    });

    it('should have correct card entry styling', () => {
      render(<CardDisplay {...defaultProps} />);

      const displayEntry = document.querySelector('.display-entry');
      expect(displayEntry).toBeInTheDocument();
      expect(displayEntry).toHaveClass('display-entry');
    });

    it('should have responsive grid layout for versions', () => {
      render(<CardDisplay {...defaultProps} />);

      // Check that version grid exists for cards with multiple prints
      const versionSection = document.querySelector('.display-version-section');
      expect(versionSection).toBeInTheDocument();
      const versionGrid = versionSection?.querySelector('.display-version-grid');
      expect(versionGrid).toBeInTheDocument();
    });
  });
});
