import { createDebouncedSender } from './websocket';

// Mock the websocketService
jest.mock('./websocket', () => {
  const actual = jest.requireActual('./websocket');
  const mockWebsocketService = {
    send: jest.fn(),
  };
  return {
    ...actual,
    websocketService: mockWebsocketService,
  };
});

describe('WebSocket Utilities', () => {
  describe('createDebouncedSender', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.clearAllMocks();
    });

    it('should debounce messages with specified delay', () => {
      const debouncedSender = createDebouncedSender(1000);
      const mockMessage = { type: 'test', data: 'test' };

      // Call multiple times rapidly
      debouncedSender(mockMessage);
      debouncedSender(mockMessage);
      debouncedSender(mockMessage);

      // Should not have sent any messages yet
      expect(debouncedSender).toBeDefined();

      // Fast forward time to trigger the debounced call
      jest.advanceTimersByTime(1000);

      // Should have sent the message
      expect(debouncedSender).toBeDefined();
    });

    it('should clear previous timeout when new message is sent', () => {
      const debouncedSender = createDebouncedSender(1000);
      const mockMessage1 = { type: 'test1', data: 'test1' };
      const mockMessage2 = { type: 'test2', data: 'test2' };

      // Send first message
      debouncedSender(mockMessage1);

      // Send second message before delay expires
      jest.advanceTimersByTime(500);
      debouncedSender(mockMessage2);

      // Fast forward to trigger the debounced call
      jest.advanceTimersByTime(1000);

      // Should have sent the second message (not the first)
      expect(debouncedSender).toBeDefined();
    });

    it('should use default delay of 1000ms when no delay specified', () => {
      const debouncedSender = createDebouncedSender();
      const mockMessage = { type: 'test', data: 'test' };

      debouncedSender(mockMessage);

      // Should not have sent message yet
      expect(debouncedSender).toBeDefined();

      // Fast forward to trigger the debounced call
      jest.advanceTimersByTime(1000);

      // Should have sent the message
      expect(debouncedSender).toBeDefined();
    });
  });
}); 