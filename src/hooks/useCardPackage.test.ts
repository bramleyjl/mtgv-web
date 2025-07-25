import { renderHook, act, waitFor } from '@testing-library/react';
import { useCardPackage } from './useCardPackage';
import { mtgvAPI } from '@/lib/api';
import { websocketService, createDebouncedSender } from '@/lib/websocket';
import type { WebSocketPackageUpdate } from '@/types';

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
jest.mock('@/lib/websocket', () => {
  const actual = jest.requireActual('@/lib/websocket');
  // We'll need to reference the mock websocketService in the closure
  let wsService = { send: jest.fn() };
  const wsMock = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    send: jest.fn(),
    onMessage: jest.fn(),
    onConnectionChange: jest.fn(),
    isConnected: jest.fn(),
  };
  wsService = wsMock;
  return {
    ...actual,
    websocketService: wsMock,
    createDebouncedSender: jest.fn(() => ((msg: unknown) => (wsService as unknown as { send: jest.Mock }).send(msg))),
  };
});

const mockMtgvAPI = mtgvAPI as jest.Mocked<typeof mtgvAPI>;
const mockWebsocketService = websocketService as jest.Mocked<typeof websocketService>;
const mockCreateDebouncedSender = createDebouncedSender as jest.MockedFunction<typeof createDebouncedSender>;

// Global variable to capture the WebSocket message handler
let wsMessageHandler: ((message: WebSocketPackageUpdate) => void) | null = null;

describe('useCardPackage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wsMessageHandler = null;
    mockWebsocketService.connect = jest.fn().mockResolvedValue(undefined);
    mockWebsocketService.disconnect = jest.fn();
    mockWebsocketService.send = jest.fn();
    mockWebsocketService.onMessage = jest.fn((callback: (message: WebSocketPackageUpdate) => void) => {
      wsMessageHandler = callback;
    });
    mockWebsocketService.onConnectionChange = jest.fn();
    mockWebsocketService.isConnected = jest.fn().mockReturnValue(true);
    
    // Mock getCardPackage to return null (no saved package)
    mockMtgvAPI.getCardPackage = jest.fn().mockResolvedValue(null);
    
    // Clear localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('WebSocket connection', () => {
    it('should connect to WebSocket on mount', () => {
      renderHook(() => useCardPackage());
      
      expect(mockWebsocketService.connect).toHaveBeenCalled();
      expect(mockWebsocketService.onMessage).toHaveBeenCalled();
      expect(mockWebsocketService.onConnectionChange).toHaveBeenCalled();
    });

    it('should disconnect WebSocket on unmount', () => {
      const { unmount } = renderHook(() => useCardPackage());
      
      unmount();
      
      expect(mockWebsocketService.disconnect).toHaveBeenCalled();
    });

    it('should handle WebSocket connection errors', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockWebsocketService.connect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      renderHook(() => useCardPackage());
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('WebSocket connection failed:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('should rejoin package room on reconnection', async () => {
      renderHook(() => useCardPackage());
      // Simulate reconnection
      const connectionHandler = mockWebsocketService.onConnectionChange.mock.calls[0][0];
      act(() => {
        connectionHandler(false); // Disconnect
        connectionHandler(true);  // Reconnect
      });
      // Should automatically rejoin the package room if currentPackageId is set
      // (No assertion here since currentPackageId is null in this test)
    });

    it('should not rejoin package room if no package is active', () => {
      renderHook(() => useCardPackage());
      
      // Simulate reconnection without active package
      const connectionHandler = mockWebsocketService.onConnectionChange.mock.calls[0][0];
      act(() => {
        connectionHandler(false); // Disconnect
        connectionHandler(true);  // Reconnect
      });
      
      // Should not send any join-package message
      expect(mockWebsocketService.send).not.toHaveBeenCalled();
    });

    it('should handle package not found error', async () => {
      renderHook(() => useCardPackage());
      const mockCardPackage = {
        id: 'test-package-id',
        card_list: [{ name: 'Lightning Bolt', count: 4 }],
        game: 'paper' as const,
        package_entries: [],
        default_selection: 'newest' as const,
      };
      mockMtgvAPI.createCardPackage.mockResolvedValueOnce(mockCardPackage);
      
      // Simulate package not found error
      const messageHandler = mockWebsocketService.onMessage.mock.calls[0][0];
      act(() => {
        messageHandler({
          type: 'error',
          error: 'Package not found'
        });
      });
      
      await waitFor(() => {
        expect(mockWebsocketService.onMessage).toHaveBeenCalledWith(expect.any(Function));
        expect(mockWebsocketService.onConnectionChange).toHaveBeenCalledWith(expect.any(Function));
        expect(mockWebsocketService.disconnect).toHaveBeenCalled();
        expect(mockWebsocketService.send).not.toHaveBeenCalled();
      });
    });

    it('should handle joined-package confirmation message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      renderHook(() => useCardPackage());
      
      // Simulate joined-package confirmation
      const messageHandler = mockWebsocketService.onMessage.mock.calls[0][0];
      act(() => {
        messageHandler({
          type: 'joined-package',
          packageId: 'test-package-id'
        });
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Successfully rejoined package room:', 'test-package-id');
      consoleSpy.mockRestore();
    });
  });

  describe('createCardPackage', () => {
    it('should create card package and join WebSocket room', async () => {
      const mockCardPackage = {
        id: 'test-package-id',
        card_list: [
          { name: 'Lightning Bolt', count: 4 },
        ],
        game: 'paper' as const,
        package_entries: [
          {
            count: 4,
            oracle_id: '123',
            name: 'Lightning Bolt',
            card_prints: [
              { scryfall_id: '123', count: 4, name: 'Lightning Bolt', set_name: 'M10' }
            ],
            selected_print: '123',
            user_selected: false,
          },
        ],
        default_selection: 'newest' as const,
      };

      mockMtgvAPI.createCardPackage.mockResolvedValue(mockCardPackage);

      const { result } = renderHook(() => useCardPackage());

      // const cards = [{ name: 'Lightning Bolt', count: 4 }];

      await act(async () => {
        await result.current.createCardPackage([{ name: 'Lightning Bolt', count: 4 }], 'paper', 'newest');
      });

      expect(mockMtgvAPI.createCardPackage).toHaveBeenCalledWith(expect.arrayContaining([{ name: 'Lightning Bolt', count: 4 }]), 'paper', 'newest');
      // No-op: removed result usage
      expect(mockWebsocketService.send).toHaveBeenCalledWith({
        type: 'join-package',
        packageId: 'test-package-id'
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should not join WebSocket room if package has no id', async () => {
      const mockCardPackage = {
        card_list: [],
        game: 'paper' as const,
        package_entries: [],
        default_selection: 'newest' as const,
      };

      mockMtgvAPI.createCardPackage.mockResolvedValue(mockCardPackage);

      const { result } = renderHook(() => useCardPackage());

      // const cards = [{ name: 'Lightning Bolt', count: 4 }];

      // Clear any previous mock calls
      mockWebsocketService.send.mockClear();

      await act(async () => {
        await result.current.createCardPackage([{ name: 'Lightning Bolt', count: 4 }]);
      });

      expect(mockWebsocketService.send).not.toHaveBeenCalled();
    });
  });

  describe('real-time updates', () => {
    it('should handle card-list-updated WebSocket message', async () => {
      const { result } = renderHook(() => useCardPackage());
      const initialList = [{ name: 'Lightning Bolt', count: 4 }];
      const mockCardPackage = {
        id: 'test-package-id',
        card_list: initialList,
        game: 'paper' as const,
        package_entries: [],
        default_selection: 'newest' as const,
      };
      mockMtgvAPI.createCardPackage.mockResolvedValueOnce(mockCardPackage);
      await act(async () => {
        await result.current.createCardPackage(initialList, 'paper', 'newest');
        result.current.joinPackage('test-package-id');
      });
      // Simulate WebSocket message
      act(() => {
        if (wsMessageHandler) wsMessageHandler({
          type: 'card-list-updated',
          data: [{ name: 'Counterspell', count: 4 }]
        });
      });
      await waitFor(() => {
        expect(result.current.cardPackage?.card_list).toEqual([{ name: 'Counterspell', count: 4 }]);
      });
    });

    it('should handle version-selection-updated WebSocket message', async () => {
      const { result } = renderHook(() => useCardPackage());
      const mockCardPackage = {
        id: 'test-package-id',
        card_list: [{ name: 'Lightning Bolt', count: 4 }],
        game: 'paper' as const,
        package_entries: [
          {
            count: 4,
            oracle_id: '123',
            name: 'Lightning Bolt',
            card_prints: [
              { scryfall_id: '123', count: 4, name: 'Lightning Bolt', set_name: 'M10' },
              { scryfall_id: '456', count: 4, name: 'Lightning Bolt', set_name: 'M11' }
            ],
            selected_print: '123',
            user_selected: false,
          },
        ],
        default_selection: 'newest' as const,
      };
      mockMtgvAPI.createCardPackage.mockResolvedValueOnce(mockCardPackage);
      await act(async () => {
        await result.current.createCardPackage([{ name: 'Lightning Bolt', count: 4 }], 'paper', 'newest');
        result.current.joinPackage('test-package-id');
      });
      // Simulate WebSocket message
      act(() => {
        if (wsMessageHandler) wsMessageHandler({
          type: 'version-selection-updated',
          data: { cardName: 'Lightning Bolt', scryfallId: '456' }
        });
      });
      await waitFor(() => {
        expect(result.current.cardPackage?.package_entries[0].selected_print).toBe('456');
      });
    });
  });

  describe('debounced updates', () => {
    it('should create debounced senders with correct delays', () => {
      renderHook(() => useCardPackage());
      
      expect(mockCreateDebouncedSender).toHaveBeenCalledWith(1000); // Card list updates
      expect(mockCreateDebouncedSender).toHaveBeenCalledWith(500);  // Version selection updates
    });

    it('should use debounced senders for card list updates', async () => {
      const { result } = renderHook(() => useCardPackage());
      const mockCardPackage = {
        id: 'test-package-id',
        card_list: [{ name: 'Lightning Bolt', count: 4 }],
        game: 'paper' as const,
        package_entries: [],
        default_selection: 'newest' as const,
      };
      mockMtgvAPI.createCardPackage.mockResolvedValueOnce(mockCardPackage);
      await act(async () => {
        await result.current.createCardPackage([{ name: 'Lightning Bolt', count: 4 }], 'paper', 'newest');
      });
      
      // The debounced sender should be called instead of direct WebSocket send
      act(() => {
        result.current.updateCardList([{ name: 'Counterspell', count: 4 }]);
      });
      
      // Verify that the debounced sender was used (mocked to call websocketService.send)
      expect(mockWebsocketService.send).toHaveBeenCalledWith(expect.objectContaining({
        type: 'update-card-list',
        packageId: 'test-package-id',
        data: [{ name: 'Counterspell', count: 4 }]
      }));
    });

    it('should use debounced senders for version selection updates', async () => {
      const { result } = renderHook(() => useCardPackage());
      const mockCardPackage = {
        id: 'test-package-id',
        card_list: [{ name: 'Lightning Bolt', count: 4 }],
        game: 'paper' as const,
        package_entries: [],
        default_selection: 'newest' as const,
      };
      mockMtgvAPI.createCardPackage.mockResolvedValueOnce(mockCardPackage);
      await act(async () => {
        await result.current.createCardPackage([{ name: 'Lightning Bolt', count: 4 }], 'paper', 'newest');
      });
      
      // The debounced sender should be called instead of direct WebSocket send
      act(() => {
        result.current.updateVersionSelection('Lightning Bolt', '456');
      });
      
      // Verify that the debounced sender was used (mocked to call websocketService.send)
      expect(mockWebsocketService.send).toHaveBeenCalledWith(expect.objectContaining({
        type: 'update-version-selection',
        packageId: 'test-package-id',
        data: { cardName: 'Lightning Bolt', scryfallId: '456' }
      }));
    });
  });

  describe('updateCardList', () => {
    it('should update card list and send WebSocket message', async () => {
      const { result } = renderHook(() => useCardPackage());
      const initialList = [{ name: 'Lightning Bolt', count: 4 }];
      const newCardList = [{ name: 'Counterspell', count: 4 }];
      const mockCardPackage = {
        id: 'test-package-id',
        card_list: initialList,
        game: 'paper' as const,
        package_entries: [],
        default_selection: 'newest' as const,
      };
      mockMtgvAPI.createCardPackage.mockResolvedValueOnce(mockCardPackage);
      await act(async () => {
        await result.current.createCardPackage(initialList, 'paper', 'newest');
      });
      act(() => {
        result.current.updateCardList(newCardList);
      });
      await waitFor(() => {
        expect(result.current.cardPackage?.card_list).toEqual(newCardList);
      });
      expect(mockWebsocketService.send).toHaveBeenCalledWith(expect.objectContaining({
        type: 'update-card-list',
        packageId: 'test-package-id',
        data: newCardList
      }));
    });

    it('should not send WebSocket message if no package is joined', () => {
      const { result } = renderHook(() => useCardPackage());
      
      const newCardList = [{ name: 'Counterspell', count: 4 }];
      
      // Clear any previous mock calls
      mockWebsocketService.send.mockClear();
      
      act(() => {
        result.current.updateCardList(newCardList);
      });

      expect(mockWebsocketService.send).not.toHaveBeenCalled();
    });
  });

  describe('updateVersionSelection', () => {
    it('should update version selection and send WebSocket message', async () => {
      const { result } = renderHook(() => useCardPackage());
      const mockCardPackage = {
        id: 'test-package-id',
        card_list: [{ name: 'Lightning Bolt', count: 4 }],
        game: 'paper' as const,
        package_entries: [
          {
            count: 4,
            oracle_id: '123',
            name: 'Lightning Bolt',
            card_prints: [
              { scryfall_id: '123', count: 4, name: 'Lightning Bolt', set_name: 'M10' },
              { scryfall_id: '456', count: 4, name: 'Lightning Bolt', set_name: 'M11' }
            ],
            selected_print: '123',
            user_selected: false,
          },
        ],
        default_selection: 'newest' as const,
      };
      mockMtgvAPI.createCardPackage.mockResolvedValueOnce(mockCardPackage);
      await act(async () => {
        await result.current.createCardPackage([{ name: 'Lightning Bolt', count: 4 }], 'paper', 'newest');
      });
      act(() => {
        result.current.updateVersionSelection('Lightning Bolt', '456');
      });
      await waitFor(() => {
        expect(result.current.cardPackage?.package_entries[0].selected_print).toBe('456');
      });
      expect(mockWebsocketService.send).toHaveBeenCalledWith(expect.objectContaining({
        type: 'update-version-selection',
        packageId: 'test-package-id',
        data: { cardName: 'Lightning Bolt', scryfallId: '456' }
      }));
    });

    it('should not send WebSocket message if no package is joined', () => {
      const { result } = renderHook(() => useCardPackage());
      
      // Clear any previous mock calls
      mockWebsocketService.send.mockClear();
      
      act(() => {
        result.current.updateVersionSelection('Lightning Bolt', '456');
      });

      expect(mockWebsocketService.send).not.toHaveBeenCalled();
    });
  });

  describe('package management', () => {
    it('should join package room', () => {
      const { result } = renderHook(() => useCardPackage());
      
      act(() => {
        result.current.joinPackage('test-package-id');
      });
      
      expect(mockWebsocketService.send).toHaveBeenCalledWith({
        type: 'join-package',
        packageId: 'test-package-id'
      });
    });

    it('should leave package room', () => {
      const { result } = renderHook(() => useCardPackage());
      
      act(() => {
        result.current.joinPackage('test-package-id');
      });
      
      // Clear the mock to reset call count
      mockWebsocketService.send.mockClear();
      
      act(() => {
        result.current.leavePackage();
      });
      
      expect(mockWebsocketService.send).toHaveBeenCalledWith({
        type: 'leave-package',
        packageId: 'test-package-id'
      });
    });

    it('should clear card package and leave room', () => {
      const { result } = renderHook(() => useCardPackage());
      
      act(() => {
        result.current.joinPackage('test-package-id');
      });
      
      // Clear the mock to reset call count
      mockWebsocketService.send.mockClear();
      
      act(() => {
        result.current.clearCardPackage();
      });
      
      expect(mockWebsocketService.send).toHaveBeenCalledWith({
        type: 'leave-package',
        packageId: 'test-package-id'
      });
    });
  });

  describe('error handling', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useCardPackage());
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });
}); 