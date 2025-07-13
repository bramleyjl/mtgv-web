import { mtgvAPI } from './api';

// Mock fetch globally
global.fetch = jest.fn();

describe('MTGV API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchCards', () => {
    it('should search cards successfully', async () => {
      const mockResponse = { cards: ['Lightning Bolt', 'Counterspell'] };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await mtgvAPI.searchCards('lightning');

      expect(fetch).toHaveBeenCalledWith(
        '/api/cards/search?query=lightning&unique_names_only=true'
      );
      expect(result).toEqual(['Lightning Bolt', 'Counterspell']);
    });

    it('should handle search errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(mtgvAPI.searchCards('lightning')).rejects.toThrow(
        'Request failed with status 500: Internal Server Error'
      );
    });
  });

  describe('createCardPackage', () => {
    it('should create card package successfully', async () => {
      const mockResponse = {
        card_package: {
          id: 'test-id',
          card_list: [{ name: 'Lightning Bolt', quantity: 4 }],
        },
      };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const cardList = [{ name: 'Lightning Bolt', count: 4 }];
      const result = await mtgvAPI.createCardPackage(cardList, 'paper', 'newest');

      expect(fetch).toHaveBeenCalledWith('/api/card_packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_list: cardList,
          game: 'paper',
          default_selection: 'newest',
        }),
      });
      expect(result).toEqual(mockResponse.card_package);
    });

    it('should handle creation errors', async () => {
      const errorResponse = { error: 'Invalid card list', details: 'Missing required fields' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      const cardList = [{ name: 'Invalid Card', count: 1 }];
      await expect(mtgvAPI.createCardPackage(cardList)).rejects.toThrow('Invalid card list: Missing required fields');
    });
  });

  describe('createRandomPackage', () => {
    it('should create random package successfully', async () => {
      const mockResponse = {
        card_package: {
          id: 'random-id',
          card_list: [
            { name: 'Lightning Bolt', quantity: 4 },
            { name: 'Counterspell', quantity: 4 },
          ],
        },
      };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await mtgvAPI.createRandomPackage(5, 'paper', 'newest');

      expect(fetch).toHaveBeenCalledWith(
        '/api/card_packages/random?count=5&game=paper&default_selection=newest'
      );
      expect(result).toEqual(mockResponse.card_package);
    });

    it('should handle random package errors', async () => {
      const errorResponse = { error: 'Invalid count parameter' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      await expect(mtgvAPI.createRandomPackage(-1)).rejects.toThrow('Invalid count parameter');
    });
  });

  describe('exportCardPackage', () => {
    it('should export card package successfully', async () => {
      const mockResponse = {
        export_url: 'https://tcgplayer.com/list/123',
        export_text: '4x Lightning Bolt\n4x Counterspell',
      };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const selectedPrints = [
        { scryfall_id: '123', count: 4, name: 'Lightning Bolt', set_name: 'M10' },
        { scryfall_id: '456', count: 4, name: 'Counterspell', set_name: 'M10' },
      ];
      const result = await mtgvAPI.exportCardPackage(selectedPrints, 'tcgplayer');

      expect(fetch).toHaveBeenCalledWith('/api/card_packages/export?type=tcgplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_prints: selectedPrints }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle export errors', async () => {
      const errorResponse = { error: 'Export failed' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => errorResponse,
      });

      const selectedPrints = [{ scryfall_id: '789', count: 1, name: 'Test Card', set_name: 'M10' }];
      await expect(mtgvAPI.exportCardPackage(selectedPrints)).rejects.toThrow('Export failed');
    });
  });
}); 