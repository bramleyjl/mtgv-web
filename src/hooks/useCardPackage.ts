import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { mtgvAPI } from '@/lib/api';
import { websocketService, createDebouncedSender } from '@/lib/websocket';
import { Card, CardPackage, GameType, DefaultSelection, UseCardPackageReturn, WebSocketPackageUpdate } from '@/types';

const PACKAGE_ID_STORAGE_KEY = 'mtgv-current-package-id';

export function useCardPackage(): UseCardPackageReturn {
  const [cardPackage, setCardPackage] = useState<CardPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPackageId, setCurrentPackageId] = useState<string | null>(null);

  // Create stable debounced senders
  const debouncedCardListSender = useMemo(() => createDebouncedSender(1000), []);
  const debouncedVersionSelectionSender = useMemo(() => createDebouncedSender(500), []);
  
  // Track the last update to prevent duplicates
  const lastUpdateRef = useRef<{oracleId: string, scryfallId: string, timestamp: number} | null>(null);

  // Restore package ID from localStorage on mount
  useEffect(() => {
    const savedPackageId = typeof window !== 'undefined' ? localStorage.getItem(PACKAGE_ID_STORAGE_KEY) : null;
    if (savedPackageId) {
      setCurrentPackageId(savedPackageId);
      setLoading(true);
      mtgvAPI.getCardPackage?.(savedPackageId)
        .then((pkg: CardPackage) => {
          setCardPackage(pkg);
          // Join the package room for real-time updates
          websocketService.send({
            type: 'join-package',
            packageId: savedPackageId
          });
        })
        .catch(() => {
          setCardPackage(null);
          setCurrentPackageId(null);
          localStorage.removeItem(PACKAGE_ID_STORAGE_KEY);
        })
        .finally(() => setLoading(false));
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
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      
      // If reconnected and we have a package, rejoin the room
      if (connected && currentPackageId) {
        websocketService.send({
          type: 'join-package',
          packageId: currentPackageId
        });
      }
    };

    const handleMessage = (message: WebSocketPackageUpdate) => {
      switch (message.type) {
        case 'card-list-updated':
          setCardPackage(prev => prev ? { ...prev, card_list: message.data as Card[] } : null);
          break;
        case 'version-selection-updated':
          setCardPackage(prev => {
            if (!prev) return null;
            const data = message.data as { oracleId: string; scryfallId: string };
            const updatedEntries = prev.package_entries.map(entry => {
              if (entry.oracle_id === data.oracleId) {
                return { ...entry, selected_print: data.scryfallId };
              }
              return entry;
            });
            return { ...prev, package_entries: updatedEntries };
          });
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

    websocketService.onConnectionChange(handleConnectionChange);
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
    if (currentPackageId && isConnected) {
      websocketService.send({
        type: 'join-package',
        packageId: currentPackageId
      });
    }
  }, [currentPackageId, isConnected]);

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
    isConnected,
    createCardPackage,
    createRandomPackage,
    updateCardList,
    updateVersionSelection,
    joinPackage,
    leavePackage,
    clearError,
    clearCardPackage,
  };
} 