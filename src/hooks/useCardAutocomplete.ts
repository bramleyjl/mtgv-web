import { useState, useEffect, useCallback, useRef } from 'react';
import { cardSearchCache, generateSearchCacheKey } from '@/lib/cache';
import { mtgvAPI } from '@/lib/api';

interface CardSuggestion {
  name: string;
  id: string;
}

interface UseCardAutocompleteOptions {
  minLength?: number;
  debounceMs?: number;
  maxResults?: number;
}

interface UseCardAutocompleteReturn {
  suggestions: CardSuggestion[];
  isLoading: boolean;
  error: string | null;
  searchCards: (query: string) => void;
  clearSuggestions: () => void;
}

export function useCardAutocomplete({
  minLength = 2,
  debounceMs = 300,
  maxResults = 15,
}: UseCardAutocompleteOptions = {}): UseCardAutocompleteReturn {
  const [suggestions, setSuggestions] = useState<CardSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchCards = useCallback(
    async (query: string) => {
      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Clear previous abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Reset state for new search
      setError(null);
      setSuggestions([]);

      // Don't search if query is too short
      if (query.length < minLength) {
        return;
      }

      // Debounce the search
      debounceTimeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        setError(null);

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        try {
          // Check cache first
          const cacheKey = generateSearchCacheKey(query, true);
          const cachedResult = cardSearchCache.get<{ cards: CardSuggestion[] }>(cacheKey);
          
          if (cachedResult) {
            // Coerce all suggestions to {id, name}
            const cachedSuggestions = cachedResult.cards.map(
              (suggestion: string | { id?: string; name?: string }, index: number) => ({
                id: String(
                  typeof suggestion === 'string'
                    ? `${suggestion}-${index}`
                    : suggestion.id ?? `${suggestion.name ?? 'unknown'}-${index}`
                ),
                name: String(
                  typeof suggestion === 'string'
                    ? suggestion
                    : suggestion.name ?? ''
                ),
              })
            );
            setSuggestions(cachedSuggestions.slice(0, maxResults));
            setIsLoading(false);
            return;
          }

          const cardObjects = await mtgvAPI.searchCards(query);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transformedSuggestions: CardSuggestion[] = cardObjects.map((obj: any, index: number) => ({
            id: String(obj.id ?? `${obj.name ?? obj}-${index}`),
            name: String(obj.name ?? obj),
          }));

          cardSearchCache.set(cacheKey, { cards: transformedSuggestions });
          setSuggestions(transformedSuggestions.slice(0, maxResults));
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            // Request was aborted, ignore
            return;
          }

          setError(err instanceof Error ? err.message : 'Failed to search cards');
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [minLength, debounceMs, maxResults]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
    
    // Clear any pending requests
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    searchCards,
    clearSuggestions,
  };
} 