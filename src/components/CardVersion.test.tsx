import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardVersion from './CardVersion';
import { CardPrint } from '@/types';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, onError, ...props }: {
    src: string;
    alt: string;
    onLoad?: () => void;
    onError?: () => void;
    [key: string]: unknown;
  }) {
    return (
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        {...props}
        data-testid="next-image"
      />
    );
  };
});

describe('CardVersion', () => {
  const mockPrint: CardPrint = {
    scryfall_id: 'test-scryfall-id',
    count: 1,
    name: 'Lightning Bolt',
    image_uris: [{ normal: 'https://api.scryfall.com/cards/test-image.jpg' }],
    prices: {
      usd: { $numberDecimal: '2.50' },
      tix: null
    },
    set_name: 'Magic 2010',
    collector_number: '133',
    rarity: 'common'
  };

  const defaultProps = {
    print: mockPrint,
    isSelected: false,
    onSelect: jest.fn(),
    cardName: 'Lightning Bolt',
    gameType: 'paper' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render card information correctly', () => {
      render(<CardVersion {...defaultProps} />);
      
      expect(screen.getByText('Magic 2010')).toBeInTheDocument();
      expect(screen.getByText('#133')).toBeInTheDocument();
      expect(screen.getByText('USD 2.50')).toBeInTheDocument();
    });

    it('should render with image_uris array', () => {
      const printWithImageUris: CardPrint = {
        ...mockPrint,
        image_uris: [{ normal: 'https://api.scryfall.com/cards/test.jpg' }]
      };
      
      render(<CardVersion {...defaultProps} print={printWithImageUris} />);
      
      const images = screen.getAllByTestId('next-image');
      expect(images).toHaveLength(2); // Fallback + actual image
    });

    it('should render with image_url string', () => {
      const printWithImageUrl: CardPrint = {
        ...mockPrint,
        image_url: 'https://api.scryfall.com/cards/direct-url.jpg'
      };
      
      render(<CardVersion {...defaultProps} print={printWithImageUrl} />);
      
      const images = screen.getAllByTestId('next-image');
      expect(images).toHaveLength(2); // Fallback + actual image
    });

    it('should render without image when no image data available', () => {
      const printWithoutImage = {
        ...mockPrint,
        image_uris: undefined,
        image_url: undefined
      } as unknown as CardPrint;
      
      render(<CardVersion {...defaultProps} print={printWithoutImage} />);
      
      // Should only show fallback image
      const images = screen.getAllByTestId('next-image');
      expect(images).toHaveLength(1);
    });

    it('should show selection indicator when isSelected is true', () => {
      render(<CardVersion {...defaultProps} isSelected={true} />);
      
      const selectionIndicator = screen.getByTestId('selected-indicator');
      expect(selectionIndicator).toBeInTheDocument();
    });

    it('should not show selection indicator when isSelected is false', () => {
      render(<CardVersion {...defaultProps} isSelected={false} />);
      
      const selectionIndicator = screen.queryByTestId('selected-indicator');
      expect(selectionIndicator).not.toBeInTheDocument();
    });
  });

  describe('Price Formatting', () => {
    it('should format USD price correctly for paper game type', () => {
      render(<CardVersion {...defaultProps} gameType="paper" />);
      
      expect(screen.getByText('USD 2.50')).toBeInTheDocument();
    });

    it('should format Tix price correctly for MTGO game type', () => {
      const printWithTix: CardPrint = {
        ...mockPrint,
        prices: {
          usd: { $numberDecimal: '2.50' },
          tix: { $numberDecimal: '1.25' }
        }
      };
      
      render(<CardVersion {...defaultProps} print={printWithTix} gameType="mtgo" />);
      
      expect(screen.getByText('Tix 1.25')).toBeInTheDocument();
    });

    it('should not show price for Arena game type', () => {
      render(<CardVersion {...defaultProps} gameType="arena" />);
      
      expect(screen.queryByText(/USD|Tix/)).not.toBeInTheDocument();
    });

    it('should not show price when price is null', () => {
      const printWithoutPrice = {
        ...mockPrint,
        prices: {
          usd: null,
          tix: null
        }
      } as unknown as CardPrint;
      
      render(<CardVersion {...defaultProps} print={printWithoutPrice} />);
      
      expect(screen.queryByText(/USD|Tix/)).not.toBeInTheDocument();
    });

    it('should not show price when price is undefined', () => {
      const printWithoutPrice = {
        ...mockPrint,
        prices: undefined
      } as unknown as CardPrint;
      
      render(<CardVersion {...defaultProps} print={printWithoutPrice} />);
      
      expect(screen.queryByText(/USD|Tix/)).not.toBeInTheDocument();
    });

    it('should format price with two decimal places', () => {
      const printWithDecimalPrice: CardPrint = {
        ...mockPrint,
        prices: {
          usd: { $numberDecimal: '1.999' },
          tix: null
        }
      };
      
      render(<CardVersion {...defaultProps} print={printWithDecimalPrice} />);
      
      expect(screen.getByText('USD 2.00')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onSelect when card is clicked', () => {
      const mockOnSelect = jest.fn();
      render(<CardVersion {...defaultProps} onSelect={mockOnSelect} />);
      
      const cardElement = screen.getByTestId('card-version');
      fireEvent.click(cardElement);
      
      expect(mockOnSelect).toHaveBeenCalledWith('test-scryfall-id');
    });


  });

  describe('Image Loading States', () => {
    it('should show loading spinner initially when image is available', () => {
      render(<CardVersion {...defaultProps} />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should handle image load success', async () => {
      render(<CardVersion {...defaultProps} />);
      
      const images = screen.getAllByTestId('next-image');
      const actualImage = images[1]; // Second image is the actual card image
      
      // Simulate image load
      fireEvent.load(actualImage);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });


  });

  describe('Styling and Classes', () => {
    it('should apply selected styling when isSelected is true', () => {
      render(<CardVersion {...defaultProps} isSelected={true} />);
      
      const cardElement = screen.getByTestId('card-version');
      expect(cardElement).toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('should apply unselected styling when isSelected is false', () => {
      render(<CardVersion {...defaultProps} isSelected={false} />);
      
      const cardElement = screen.getByTestId('card-version');
      expect(cardElement).toHaveClass('border-gray-300', 'hover:border-gray-400');
    });

    it('should have hover effects', () => {
      render(<CardVersion {...defaultProps} />);
      
      const cardElement = screen.getByTestId('card-version');
      expect(cardElement).toHaveClass('hover:scale-105', 'transition-all', 'duration-200');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing set_name', () => {
      const printWithoutSetName = {
        ...mockPrint,
        set_name: undefined
      } as unknown as CardPrint;
      
      render(<CardVersion {...defaultProps} print={printWithoutSetName} />);
      
      expect(screen.getByText('Unknown Set')).toBeInTheDocument();
    });

    it('should handle missing collector_number', () => {
      const printWithoutCollectorNumber = {
        ...mockPrint,
        collector_number: undefined
      } as unknown as CardPrint;
      
      render(<CardVersion {...defaultProps} print={printWithoutCollectorNumber} />);
      
      expect(screen.getByText('#N/A')).toBeInTheDocument();
    });

    it('should handle empty image_uris array', () => {
      const printWithEmptyImageUris: CardPrint = {
        ...mockPrint,
        image_uris: []
      };
      
      render(<CardVersion {...defaultProps} print={printWithEmptyImageUris} />);
      
      // Should only show fallback image
      const images = screen.getAllByTestId('next-image');
      expect(images).toHaveLength(1);
    });

    it('should handle image_uris with missing normal property', () => {
      const printWithInvalidImageUris: CardPrint = {
        ...mockPrint,
        image_uris: [{ small: 'https://api.scryfall.com/cards/small.jpg' }]
      };
      
      render(<CardVersion {...defaultProps} print={printWithInvalidImageUris} />);
      
      // Should only show fallback image
      const images = screen.getAllByTestId('next-image');
      expect(images).toHaveLength(1);
    });
  });
}); 