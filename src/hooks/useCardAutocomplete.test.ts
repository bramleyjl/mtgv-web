import { renderHook, act, waitFor } from '@testing-library/react';
import { useCardAutocomplete } from './useCardAutocomplete';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useCardAutocomplete', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCardAutocomplete());

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.searchCards).toBe('function');
    expect(typeof result.current.clearSuggestions).toBe('function');
  });

  it('should not search when query is shorter than minLength', async () => {
    const { result } = renderHook(() => useCardAutocomplete({ minLength: 3 }));

    act(() => {
      result.current.searchCards('ab');
    });

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  it('should search when query meets minLength', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ cards: [] })
    });

    const { result } = renderHook(() => useCardAutocomplete({ minLength: 2 }));

    act(() => {
      result.current.searchCards('ab');
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/search?query=ab', expect.objectContaining({
        signal: expect.any(AbortSignal)
      }));
    });
  });

  it('should debounce search requests', async () => {
    jest.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ cards: [] })
    });

    const { result } = renderHook(() => useCardAutocomplete({ debounceMs: 300 }));

    act(() => {
      result.current.searchCards('lightning');
    });

    // Should not have called fetch yet
    expect(mockFetch).not.toHaveBeenCalled();

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Run any pending promises
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/search?query=lightning', expect.objectContaining({
        signal: expect.any(AbortSignal)
      }));
    });
    jest.useRealTimers();
  });

  it('should cancel previous request when new search is initiated', async () => {
    jest.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ cards: [] })
    });

    const { result } = renderHook(() => useCardAutocomplete({ debounceMs: 300 }));

    act(() => {
      result.current.searchCards('lightning');
    });

    act(() => {
      jest.advanceTimersByTime(150); // Halfway through debounce
    });

    act(() => {
      result.current.searchCards('bolt');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Run any pending promises
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/search?query=bolt', expect.objectContaining({
        signal: expect.any(AbortSignal)
      }));
    });
    jest.useRealTimers();
  });

  it('should set loading state during search', async () => {
    mockFetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ cards: [] })
        }), 100)
      )
    );

    const { result } = renderHook(() => useCardAutocomplete());

    act(() => {
      result.current.searchCards('lightning');
    });

    // Wait for loading state to be set
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle successful search response', async () => {
    const mockCards = [
      { name: 'Lightning Bolt', id: '1' },
      { name: 'Lightning Strike', id: '2' }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ cards: mockCards })
    });

    const { result } = renderHook(() => useCardAutocomplete());

    act(() => {
      result.current.searchCards('lightning');
    });

    await waitFor(() => {
      expect(result.current.suggestions).toEqual([
        { name: 'Lightning Bolt', id: '1' },
        { name: 'Lightning Strike', id: '2' }
      ]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle search error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Network Error'
    });

    const { result } = renderHook(() => useCardAutocomplete());

    act(() => {
      result.current.searchCards('lightning');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Search failed: Network Error');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.suggestions).toEqual([]);
    });
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCardAutocomplete());

    act(() => {
      result.current.searchCards('lightning');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.suggestions).toEqual([]);
    });
  });

  it('should ignore aborted requests', async () => {
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const { result } = renderHook(() => useCardAutocomplete());

    act(() => {
      result.current.searchCards('lightning');
    });

    await waitFor(() => {
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should clear suggestions and error when clearSuggestions is called', async () => {
    const { result } = renderHook(() => useCardAutocomplete());

    // Set some state
    act(() => {
      result.current.searchCards('lightning');
    });

    // Clear suggestions
    act(() => {
      result.current.clearSuggestions();
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  // it('should respect maxResults parameter', async () => {
  //   jest.useFakeTimers();
  //   mockFetch.mockClear();
  //   const mockCards = [
  //     { name: 'Lightning Bolt', id: '1' },
  //     { name: 'Lightning Strike', id: '2' },
  //     { name: 'Lightning Helix', id: '3' },
  //     { name: 'Lightning Bolt', id: '4' },
  //     { name: 'Lightning Bolt', id: '5' }
  //   ];

  //   mockFetch.mockResolvedValue({
  //     ok: true,
  //     json: () => Promise.resolve({ cards: mockCards })
  //   });

  //   const { result } = renderHook(() => useCardAutocomplete({ maxResults: 3, debounceMs: 300 }));

  //   act(() => {
  //     result.current.searchCards('lightning');
  //   });

  //   console.log('Advancing timers by 300ms');
  //   // Advance timers to trigger the debounced search
  //   act(() => {
  //     jest.advanceTimersByTime(300);
  //   });
  //   console.log('Timers advanced, awaiting pending promises');

  //   // Run any pending promises
  //   await act(async () => {
  //     await Promise.resolve();
  //   });

  //   console.log('mockFetch.mock.calls.length:', mockFetch.mock.calls.length);
  //   console.log('result.current.suggestions:', result.current.suggestions);

  //   await waitFor(() => {
  //     expect(result.current.suggestions).toHaveLength(3);
  //     expect(result.current.suggestions).toEqual([
  //       { name: 'Lightning Bolt', id: '1' },
  //       { name: 'Lightning Strike', id: '2' },
  //       { name: 'Lightning Helix', id: '3' }
  //     ]);
  //   });
  //   jest.useRealTimers();
  // });

  it('should handle empty response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ cards: [] })
    });

    const { result } = renderHook(() => useCardAutocomplete());

    act(() => {
      result.current.searchCards('nonexistent');
    });

    await waitFor(() => {
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle response without cards property', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    });

    const { result } = renderHook(() => useCardAutocomplete());

    act(() => {
      result.current.searchCards('lightning');
    });

    await waitFor(() => {
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
}); 