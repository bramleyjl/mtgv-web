import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { mtgvAPI } from '@/lib/api';
import { websocketService, createDebouncedSender } from '@/lib/websocket';
import { Card, CardPackage, GameType, DefaultSelection, UseCardPackageReturn, WebSocketPackageUpdate } from '@/types';

const PACKAGE_ID_STORAGE_KEY = 'mtgv-current-package-id';

export function useCardPackage(): UseCardPackageReturn {
  const [cardPackage, setCardPackage] = useState<CardPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPackageId, setCurrentPackageId] = useState<string | null>(null);

  // Create stable debounced senders
  const debouncedCardListSender = useMemo(() => createDebouncedSender(1000), []);
  const debouncedVersionSelectionSender = useMemo(() => createDebouncedSender(500), []);
  
  // Track the last update to prevent duplicates
  const lastUpdateRef = useRef<{oracleId: string, scryfallId: string, timestamp: number} | null>(null);
  
  // Flag to prevent WebSocket messages from overriding API data during initial load
  const isInitialLoadRef = useRef(true);

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
        .catch((error) => {
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
          setCardPackage(prev => {
            if (!prev) return null;
            
            // Find the entry that this update is trying to modify
            const targetEntry = prev.package_entries.find(entry => entry.oracle_id === data.oracleId);
            
            // If the update doesn't match our current state, ignore it
            if (targetEntry && targetEntry.selected_print !== data.scryfallId) {
              return prev; // Don't update
            }
            // If it matches or we don't have a current state, apply the update
            const updatedEntries = prev.package_entries.map(entry => {
              if (entry.oracle_id === data.oracleId) {
                return { ...entry, selected_print: data.scryfallId };
              }
              return entry;
            });
            return { ...prev, package_entries: updatedEntries };
          });
          break;
        case 'card-list-updated':
          break;
        case 'joined-package':
          break;
        case 'error':
          if (message.error === 'Package not found') {
            setCardPackage(null);
            setCurrentPackageId(null);
            setError('Package no longer exists');
            if (typeof window !== 'undefined') {
              localStorage.removeItem(PACKAGE_ID_STORAGE_KEY);
            }
          }
          break;
      }
    };

    websocketService.onMessage(handleMessage);

    // Connect to WebSocket
    websocketService.connect().catch(err => {
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
    setCurrentPackageId(packageId);
    websocketService.send({
      type: 'join-package',
      packageId
    });
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
    setCardPackage(prev => prev ? { ...prev, card_list: cards } : null);
    
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
    setCardPackage(prev => {
      if (!prev) return null;
      
      const updatedEntries = prev.package_entries.map(entry => {
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
      setError(err instanceof Error ? err.message : 'Failed to create card package');
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
      setError(err instanceof Error ? err.message : 'Failed to create random package');
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

  return {
    cardPackage,
    loading,
    error,
    createCardPackage,
    createRandomPackage,
    updateCardList,
    updateVersionSelection,
    joinPackage,
    leavePackage,
    clearCardPackage,
    clearError
  };
} 