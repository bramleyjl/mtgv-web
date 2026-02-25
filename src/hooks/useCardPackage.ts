import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { mtgvAPI, MTGVAPIError } from '@/lib/api';
import { websocketService, createDebouncedSender } from '@/lib/websocket';
import { Card, CardPackage, PackageEntry, GameType, DefaultSelection, UseCardPackageReturn, WebSocketPackageUpdate } from '@/types';

const PACKAGE_ID_STORAGE_KEY = 'mtgv-current-package-id';

export function useCardPackage(): UseCardPackageReturn {
  const [cardPackage, setCardPackageRaw] = useState<CardPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPackageId, setCurrentPackageId] = useState<string | null>(null);

  const setCardPackage = useCallback((value: any) => {
    if (typeof value === 'function') {
      setCardPackageRaw(value);
    } else {
      setCardPackageRaw(value);
    }
  }, []);

  // Create stable debounced senders
  const debouncedCardListSender = useMemo(() => createDebouncedSender(1000), []);
  const debouncedVersionSelectionSender = useMemo(() => createDebouncedSender(500), []);

  // Track the last update to prevent duplicates
  const lastUpdateRef = useRef<{ oracleId: string, scryfallId: string, timestamp: number } | null>(null);

  // Flag to prevent WebSocket messages from overriding API data during initial load
  const isInitialLoadRef = useRef(true);

  // Ref to always have access to current cardPackage state in WebSocket handler
  const cardPackageRef = useRef<CardPackage | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    cardPackageRef.current = cardPackage;
  }, [cardPackage]);

  // Clear debounced sender state when package changes
  useEffect(() => {
    if (cardPackage?.package_id) {
      // Clear any pending debounced messages when package changes
      debouncedCardListSender.cancel();
      debouncedVersionSelectionSender.cancel();
    }
  }, [cardPackage?.package_id, debouncedCardListSender, debouncedVersionSelectionSender]);

  // Restore package ID from localStorage on mount
  useEffect(() => {
    const savedPackageId = typeof window !== 'undefined' ? localStorage.getItem(PACKAGE_ID_STORAGE_KEY) : null;
    if (savedPackageId) {
      setCurrentPackageId(savedPackageId);
      setLoading(true);
      isInitialLoadRef.current = true; // Set flag during initial load
      mtgvAPI.getCardPackage?.(savedPackageId)
        .then((pkg: CardPackage) => {
          setCardPackage(pkg);
          // Join the package room for real-time updates
          websocketService.send({
            type: 'join-package',
            packageId: savedPackageId
          });
          // Allow WebSocket messages after a short delay to ensure API data is set
          setTimeout(() => {
            isInitialLoadRef.current = false;
          }, 1000);
        })
        .catch(() => {
          setCardPackage(null);
          setCurrentPackageId(null);
          localStorage.removeItem(PACKAGE_ID_STORAGE_KEY);
          isInitialLoadRef.current = false;
        })
        .finally(() => setLoading(false));
    } else {
      isInitialLoadRef.current = false;
    }
  }, []);

  // Persist currentPackageId to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentPackageId) {
      localStorage.setItem(PACKAGE_ID_STORAGE_KEY, currentPackageId);
    } else {
      localStorage.removeItem(PACKAGE_ID_STORAGE_KEY);
    }
  }, [currentPackageId]);

  // WebSocket connection setup (only once)
  useEffect(() => {
    const handleMessage = (message: WebSocketPackageUpdate) => {
      // Don't process WebSocket messages during initial load to prevent overriding API data
      if (isInitialLoadRef.current) {
        return;
      }

      switch (message.type) {
        case 'version-selection-updated':
          const data = message.data as { oracleId: string; scryfallId: string };
          setCardPackage((prev: CardPackage | null) => {
            if (!prev) return null;

            // Find the entry that this update is trying to modify
            const targetEntry = prev.package_entries.find((entry: PackageEntry) => entry.oracle_id === data.oracleId);

            // If the update doesn't match our current state, ignore it
            if (targetEntry && targetEntry.selected_print !== data.scryfallId) {
              return prev; // Don't update
            }
            // If it matches or we don't have a current state, apply the update
            const updatedEntries = prev.package_entries.map((entry: PackageEntry) => {
              if (entry.oracle_id === data.oracleId) {
                return { ...entry, selected_print: data.scryfallId };
              }
              return entry;
            });
            return { ...prev, package_entries: updatedEntries };
          });
          break;
        case 'card-added':
          // Skip success messages (they don't have data property)
          if ('success' in message || !message.data) {
            break;
          }

          // Update package with newly added card from WebSocket event
          const cardData = message.data as { cardEntry: any; cardList: Card[] };

          setCardPackage((prev: CardPackage | null) => {
            // Use the ref value if prev is null (stale closure issue)
            const current = prev || cardPackageRef.current;
            if (!current) {
              return null;
            }
            const updated = {
              ...current,
              package_entries: [...current.package_entries, cardData.cardEntry],
              card_list: cardData.cardList
            };
            return updated;
          });

          // Clear the timeout if it exists
          if ((window as any).__addCardTimeout) {
            clearTimeout((window as any).__addCardTimeout);
            (window as any).__addCardTimeout = null;
          }

          setLoading(false); // Clear loading state after card is added
          break;
        case 'card-list-updated':
          break;
        case 'joined-package':
          break;
        case 'error':
          if (message.error === 'Package not found') {
            setCardPackage(null);
            setCurrentPackageId(null);

            // Clear the timeout if it exists
            if ((window as any).__addCardTimeout) {
              clearTimeout((window as any).__addCardTimeout);
              (window as any).__addCardTimeout = null;
            }

            setError('Package no longer exists');
            if (typeof window !== 'undefined') {
              localStorage.removeItem(PACKAGE_ID_STORAGE_KEY);
            }
          } else if (message.error && currentPackageId) {
            // Handle other errors (e.g., card not found)
            setError(message.error);
            setLoading(false);
          }
          break;
      }
    };

    websocketService.onMessage(handleMessage);

    // Connect to WebSocket
    websocketService.connect().catch(() => {
      // Don't set error for users - WebSocket is internal infrastructure
    });

    return () => {
      // Don't disconnect here - let the connection stay alive
    };
  }, []); // Remove currentPackageId from dependencies

  // Handle package ID changes separately
  useEffect(() => {
    if (currentPackageId) {
      websocketService.send({
        type: 'join-package',
        packageId: currentPackageId
      });
    }
  }, [currentPackageId]);

  const joinPackage = useCallback((packageId: string) => {
    // Just set the package ID - the useEffect above will handle sending the WebSocket message
    setCurrentPackageId(packageId);
  }, []);

  const leavePackage = useCallback(() => {
    if (currentPackageId) {
      websocketService.send({
        type: 'leave-package',
        packageId: currentPackageId
      });
      setCurrentPackageId(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PACKAGE_ID_STORAGE_KEY);
      }
    }
  }, [currentPackageId]);

  const updateCardList = useCallback((cards: Card[]) => {
    if (!currentPackageId) return;

    // Update local state immediately for responsive UI
    setCardPackage((prev: CardPackage | null) => prev ? { ...prev, card_list: cards } : null);

    // Debounced WebSocket update
    debouncedCardListSender({
      type: 'update-card-list',
      packageId: currentPackageId,
      data: cards
    });
  }, [currentPackageId, debouncedCardListSender]);

  const updateVersionSelection = useCallback((oracleId: string, scryfallId: string) => {
    if (!currentPackageId) return;

    // Optimistic UI update
    setCardPackage((prev: CardPackage | null) => {
      if (!prev) return null;

      const updatedEntries = prev.package_entries.map((entry: PackageEntry) => {
        if (entry.oracle_id === oracleId) {
          return { ...entry, selected_print: scryfallId };
        }
        return entry;
      });

      return { ...prev, package_entries: updatedEntries };
    });

    // Track this update to prevent duplicate processing
    lastUpdateRef.current = {
      oracleId,
      scryfallId,
      timestamp: Date.now()
    };

    // Send WebSocket message
    debouncedVersionSelectionSender({
      type: 'update-version-selection',
      packageId: currentPackageId,
      data: { oracleId, scryfallId }
    });
  }, [currentPackageId, debouncedVersionSelectionSender]);

  // Clear the last update ref when the package changes
  useEffect(() => {
    lastUpdateRef.current = null;
  }, [currentPackageId]);

  const createCardPackage = async (
    cards: Card[],
    game: GameType = 'paper',
    defaultSelection: DefaultSelection = 'newest'
  ): Promise<void> => {
    if (cards.length === 0) {
      setError('Cannot create package: no cards in list');
      return;
    }

    setLoading(true);
    setError(null);
    setCardPackage(null);
    isInitialLoadRef.current = false; // Allow WebSocket messages for new packages

    try {
      const result = await mtgvAPI.createCardPackage(cards, game, defaultSelection);
      setCardPackage(result);

      if (result.package_id) {
        joinPackage(result.package_id);
      }
    } catch (err) {
      if (err instanceof MTGVAPIError) {
        if (err.isNetworkError) {
          setError('Network error: Please check your internet connection and try again.');
        } else if (err.isTimeoutError) {
          setError('Request timed out: This might be a large package. Please try again or reduce the number of cards.');
        } else if (err.isServerError) {
          setError('Server error: The server is experiencing issues. Please try again later.');
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create card package');
      }
    } finally {
      setLoading(false);
    }
  };

  const createRandomPackage = async (
    count: number,
    game: GameType = 'paper',
    defaultSelection: DefaultSelection = 'newest'
  ): Promise<void> => {
    if (count <= 0) {
      setError('Count must be greater than 0');
      return;
    }

    setLoading(true);
    setError(null);
    setCardPackage(null);
    isInitialLoadRef.current = false; // Allow WebSocket messages for new packages

    try {
      const result = await mtgvAPI.createRandomPackage(count, game, defaultSelection);
      setCardPackage(result);

      // Join the package room for real-time updates
      if (result.package_id) {
        joinPackage(result.package_id);
      }
    } catch (err) {
      if (err instanceof MTGVAPIError) {
        if (err.isNetworkError) {
          setError('Network error: Please check your internet connection and try again.');
        } else if (err.isTimeoutError) {
          setError('Request timed out: Please try again.');
        } else if (err.isServerError) {
          setError('Server error: The server is experiencing issues. Please try again later.');
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create random package');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const clearCardPackage = () => {
    leavePackage();
    setCardPackage(null);
    setError(null);
    setCurrentPackageId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PACKAGE_ID_STORAGE_KEY);
    }
  };

  const addCardToPackage = async (
    cardName: string,
    quantity?: number,
    game?: GameType,
    defaultSelection?: DefaultSelection
  ): Promise<void> => {
    const actualQuantity = quantity ?? 1;
    const actualGame = game ?? 'paper';
    const actualDefaultSelection = defaultSelection ?? 'newest';

    if (!cardName.trim()) {
      setError('Card name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // If no package exists, create one with this card using REST API
      if (!currentPackageId) {
        const card: Card = { name: cardName.trim(), count: actualQuantity };
        await createCardPackage([card], actualGame, actualDefaultSelection);
        return;
      }

      // If package exists, add card via WebSocket
      websocketService.send({
        type: 'add-card-to-package',
        packageId: currentPackageId,
        data: {
          cardName: cardName.trim(),
          count: actualQuantity
        }
      });

      // Set a timeout in case the WebSocket response never arrives
      const timeoutId = setTimeout(() => {
        setLoading(false);
        setError('Request timed out. Please try again.');
      }, 10000); // 10 second timeout

      // Store timeout ID to clear it if we get a response
      // We'll clear it in the 'card-added' event handler
      (window as any).__addCardTimeout = timeoutId;

      // Loading state will be cleared when 'card-added' event is received
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add card to package');
      }
    }
  };

  return {
    cardPackage,
    loading,
    error,
    createCardPackage,
    createRandomPackage,
    addCardToPackage,
    updateCardList,
    updateVersionSelection,
    joinPackage,
    leavePackage,
    clearCardPackage,
    clearError
  };
}
