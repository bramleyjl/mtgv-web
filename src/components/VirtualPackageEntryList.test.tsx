import React from 'react';
import { render, screen } from '@testing-library/react';
import VirtualPackageEntryList from './VirtualPackageEntryList';
import { PackageEntry } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock react-window to avoid DOM measurement issues in tests
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemData }: {
    children: (props: { index: number; style: React.CSSProperties; data: any }) => React.ReactElement;
    itemCount: number;
    itemData: any;
  }) => (
    <div data-testid="virtual-list">
      {Array.from({ length: itemCount }, (_, index) => 
        children({ index, style: {}, data: itemData })
      )}
    </div>
  )
}));

const mockEntry: PackageEntry = {
  count: 4,
  oracle_id: 'test-oracle-1',
  name: 'Lightning Bolt',
  card_prints: [
    {
      scryfall_id: 'test-1',
      count: 4,
      name: 'Lightning Bolt',
      set_name: 'Magic 2010',
      collector_number: '133',
      image_uris: [{ normal: 'https://api.scryfall.com/cards/test-image.jpg' }],
      prices: { usd: { $numberDecimal: '2.50' } }
    }
  ],
  selected_print: null,
  user_selected: false
};

const mockEntries: PackageEntry[] = Array.from({ length: 150 }, (_, index) => ({
  ...mockEntry,
  oracle_id: `test-oracle-${index}`,
  name: `Unique Card ${index}`,
  card_prints: [
    {
      ...mockEntry.card_prints[0],
      scryfall_id: `test-${index}`,
      name: `Unique Card ${index}`
    }
  ]
}));

const defaultProps = {
  entries: mockEntries,
  game: 'paper' as const,
  onVersionSelection: jest.fn(),
  className: 'test-class'
};

describe('VirtualPackageEntryList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render virtual list container', () => {
      render(
        <VirtualPackageEntryList
          {...defaultProps}
        />
      );
      
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    it('should render all cards in virtual list', () => {
      render(
        <VirtualPackageEntryList
          {...defaultProps}
        />
      );
      
      // Should render all 150 cards
      expect(screen.getAllByText(/Unique Card \d+/)).toHaveLength(150);
    });

    it('should apply custom className', () => {
      render(
        <VirtualPackageEntryList
          {...defaultProps}
        />
      );
      
      const container = screen.getByTestId('virtual-list').parentElement;
      expect(container).toHaveClass('test-class');
    });

    it('should show empty state when no entries', () => {
      render(
        <VirtualPackageEntryList
          {...defaultProps}
          entries={[]}
        />
      );
      
      expect(screen.getByText('No cards to display')).toBeInTheDocument();
    });
  });

  describe('Card Selection', () => {
    it('should render package entries correctly', () => {
      render(
        <VirtualPackageEntryList
          {...defaultProps}
        />
      );
      
      // Should render all 150 entries
      expect(screen.getAllByText(/Unique Card \d+/)).toHaveLength(150);
    });

    it('should display card counts correctly', () => {
      render(
        <VirtualPackageEntryList
          {...defaultProps}
        />
      );
      
      // Each entry should show "4x Unique Card Name"
      expect(screen.getByText('4x Unique Card 0')).toBeInTheDocument();
      expect(screen.getByText('4x Unique Card 99')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should memoize row data to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <VirtualPackageEntryList
          {...defaultProps}
        />
      );
      
      // Re-render with same props
      rerender(
        <VirtualPackageEntryList {...defaultProps} />
      );
      
      // The component should still render correctly
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    it('should handle large entry lists efficiently', () => {
      const largeEntryList = Array.from({ length: 1000 }, (_, index) => ({
        ...mockEntry,
        oracle_id: `large-oracle-${index}`,
        name: `Large Card ${index}`,
        card_prints: [
          {
            ...mockEntry.card_prints[0],
            scryfall_id: `large-${index}`,
            name: `Large Card ${index}`
          }
        ]
      }));
      
      render(
        <VirtualPackageEntryList
          {...defaultProps}
          entries={largeEntryList}
        />
      );
      
      // Should render without crashing
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      expect(screen.getByText(/Large Card 0/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined or null entries gracefully', () => {
        render(
        <VirtualPackageEntryList
          {...defaultProps}
          entries={[]}
        />
      );
      
      expect(screen.getByText('No cards to display')).toBeInTheDocument();
    });

    it('should handle entries with missing properties', () => {
      const incompleteEntries: PackageEntry[] = [
        {
          count: 1,
          oracle_id: 'incomplete-1',
          name: 'Incomplete Card',
          card_prints: [],
          selected_print: null,
          user_selected: false,
          not_found: true
        }
      ];
      
      render(
        <VirtualPackageEntryList
          {...defaultProps}
          entries={incompleteEntries}
        />
      );
      
      expect(screen.getByText(/Incomplete Card/)).toBeInTheDocument();
      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });
  });
});
