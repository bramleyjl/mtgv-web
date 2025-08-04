import { renderHook, act, waitFor } from '@testing-library/react';
import { useCardPackage } from './useCardPackage';
import { mtgvAPI } from '@/lib/api';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock the API and WebSocket services
jest.mock('@/lib/api');
jest.mock('@/lib/websocket', () => ({
  websocketService: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    send: jest.fn(),
    onMessage: jest.fn(),
    onConnectionChange: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
  },
  createDebouncedSender: jest.fn(() => ({
    send: jest.fn(),
    cancel: jest.fn(),
  })),
}));

const mockMtgvAPI = mtgvAPI as jest.Mocked<typeof mtgvAPI>;

describe('useCardPackage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getCardPackage to return null (no saved package)
    mockMtgvAPI.getCardPackage = jest.fn().mockResolvedValue(null);
    
    // Clear localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useCardPackage());
      
      expect(result.current.cardPackage).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should load saved package from localStorage', async () => {
      const savedPackageId = 'test-package-id';
      localStorageMock.getItem.mockReturnValue(savedPackageId);
      
      const mockPackage = {
        package_id: savedPackageId,
        card_list: [{ name: 'Lightning Bolt', count: 4 }],
        game: 'paper' as const,
        package_entries: [],
        default_selection: 'newest' as const,
      };
      
      mockMtgvAPI.getCardPackage = jest.fn().mockResolvedValue(mockPackage);
      
      const { result } = renderHook(() => useCardPackage());
      
      await waitFor(() => {
        expect(result.current.cardPackage).toEqual(mockPackage);
      });
    });
  });

  describe('Card Package Creation', () => {
    it('should create card package successfully', async () => {
      const mockPackage = {
        package_id: 'test-package-id',
        card_list: [{ name: 'Lightning Bolt', count: 4 }],
        game: 'paper' as const,
        package_entries: [],
        default_selection: 'newest' as const,
      };
      
      mockMtgvAPI.createCardPackage = jest.fn().mockResolvedValue(mockPackage);
      
      const { result } = renderHook(() => useCardPackage());
      
      await act(async () => {
        await result.current.createCardPackage([{ name: 'Lightning Bolt', count: 4 }]);
      });
      
      expect(result.current.cardPackage).toEqual(mockPackage);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle card package creation error', async () => {
      const error = new Error('Failed to create package');
      mockMtgvAPI.createCardPackage = jest.fn().mockRejectedValue(error);
      
      const { result } = renderHook(() => useCardPackage());
      
      await act(async () => {
        await result.current.createCardPackage([{ name: 'Lightning Bolt', count: 4 }]);
      });
      
      expect(result.current.error).toBe('Failed to create package');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Random Package Creation', () => {
    it('should create random package successfully', async () => {
      const mockPackage = {
        package_id: 'random-package-id',
        card_list: [{ name: 'Lightning Bolt', count: 1 }],
        game: 'paper' as const,
        package_entries: [],
        default_selection: 'newest' as const,
      };
      
      mockMtgvAPI.createRandomPackage = jest.fn().mockResolvedValue(mockPackage);
      
      const { result } = renderHook(() => useCardPackage());
      
      await act(async () => {
        await result.current.createRandomPackage(10);
      });
      
      expect(result.current.cardPackage).toEqual(mockPackage);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Package Management', () => {
    it('should clear card package', () => {
      const { result } = renderHook(() => useCardPackage());
      
      act(() => {
        result.current.clearCardPackage();
      });
      
      expect(result.current.cardPackage).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mtgv-current-package-id');
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useCardPackage());
      
      // Set an error first
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('Network error');
      mockMtgvAPI.createCardPackage = jest.fn().mockRejectedValue(error);
      
      const { result } = renderHook(() => useCardPackage());
      
      await act(async () => {
        await result.current.createCardPackage([{ name: 'Lightning Bolt', count: 4 }]);
      });
      
      expect(result.current.error).toBe('Network error');
      expect(result.current.loading).toBe(false);
    });
  });
}); 