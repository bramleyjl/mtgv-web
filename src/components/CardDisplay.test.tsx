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
    onClearPackage: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render package information correctly', () => {
      render(<CardDisplay {...defaultProps} />);
      
      expect(screen.getByText('Package Results')).toBeInTheDocument();
      expect(screen.getByText(/Game Type:/)).toBeInTheDocument();
      expect(screen.getByText(/Default Selection:/)).toBeInTheDocument();
      expect(screen.getByText(/Cards in Package:/)).toBeInTheDocument();
    });

    it('should render card entries with correct information', () => {
      render(<CardDisplay {...defaultProps} />);
      
      expect(screen.getByText('2x Lightning Bolt')).toBeInTheDocument();
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
      expect(screen.getByText('Magic 2010')).toBeInTheDocument();
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
      
      expect(screen.getByText('Version:')).toBeInTheDocument();
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
      
      expect(screen.getByText('2x Lightning Bolt')).toBeInTheDocument();
      expect(screen.queryByText('Select Version:')).not.toBeInTheDocument();
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
      
      expect(screen.getByText('Version:')).toBeInTheDocument();
      expect(screen.queryByText('Select Version:')).not.toBeInTheDocument();
    });

    it('should handle cards with multiple prints', () => {
      render(<CardDisplay {...defaultProps} />);
      
      expect(screen.getByText('Select Version:')).toBeInTheDocument();
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
    it('should call onClearPackage when clear button is clicked', () => {
      const mockOnClearPackage = jest.fn();
      render(<CardDisplay {...defaultProps} onClearPackage={mockOnClearPackage} />);
      
      const clearButton = screen.getByText('Clear Package');
      fireEvent.click(clearButton);
      
      expect(mockOnClearPackage).toHaveBeenCalled();
    });

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
      
      expect(screen.getByText('2x Lightning Bolt')).toBeInTheDocument();
      expect(screen.queryByText('Select Version:')).not.toBeInTheDocument();
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
      
      expect(screen.getByText('Version:')).toBeInTheDocument();
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
      
      expect(screen.getByText('2x Lightning Bolt')).toBeInTheDocument();
      expect(screen.getByText('1x Counterspell')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have correct container styling', () => {
      render(<CardDisplay {...defaultProps} />);
      
      const container = screen.getByText('Package Results').closest('section');
      expect(container).toHaveClass('bg-green-900', 'rounded-lg', 'shadow-lg');
    });

    it('should have correct card entry styling', () => {
      render(<CardDisplay {...defaultProps} />);
      
      const cardEntry = screen.getByText('2x Lightning Bolt').closest('div');
      const parentDiv = cardEntry?.parentElement;
      expect(parentDiv).toHaveClass('bg-green-800', 'rounded-lg', 'border');
    });

    it('should have responsive grid layout for versions', () => {
      render(<CardDisplay {...defaultProps} />);
      
      const versionGrid = screen.getByText('Select Version:').nextElementSibling;
      expect(versionGrid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3');
    });
  });
}); 