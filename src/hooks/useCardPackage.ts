import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Debounced senders for real-time updates
  const debouncedCardListSender = useRef(createDebouncedSender(1000));
  const debouncedVersionSelectionSender = useRef(createDebouncedSender(500));

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

  // WebSocket connection and message handling
  useEffect(() => {
    console.log('[useCardPackage] useEffect mount: connecting WebSocket');
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
          console.log('WebSocket card-list-updated:', message.data);
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
          console.log('Successfully rejoined package room:', message.packageId);
          break;
        case 'error':
          console.error('WebSocket error:', message.error);
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
      console.warn('WebSocket connection failed:', err);
      // Don't set error for users - WebSocket is internal infrastructure
    });

    return () => {
      console.log('[useCardPackage] useEffect cleanup: disconnecting WebSocket');
      websocketService.disconnect();
    };
    // NOTE: If you see double connect/disconnect logs in development, check if React Strict Mode is enabled. Strict Mode intentionally double-mounts components to help find bugs, which can cause this effect to run twice.
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
    debouncedCardListSender.current({
      type: 'update-card-list',
      packageId: currentPackageId,
      data: cards
    });
  }, [currentPackageId]);

  const updateVersionSelection = useCallback((oracleId: string, scryfallId: string) => {
    console.log(`useCardPackage updateVersionSelection:`, {
      oracleId,
      scryfallId,
      currentPackageId
    });
    
    if (!currentPackageId) return;
    
    // Optimistic UI update
    setCardPackage(prev => {
      if (!prev) return null;
      const updatedEntries = prev.package_entries.map(entry => {
        if (entry.oracle_id === oracleId) {
          console.log(`Updating entry ${entry.name} (oracle_id: ${entry.oracle_id}) selected_print from ${entry.selected_print} to ${scryfallId}`);
          return { ...entry, selected_print: scryfallId };
        }
        return entry;
      });
      return { ...prev, package_entries: updatedEntries };
    });
    
    // Debounced WebSocket update
    debouncedVersionSelectionSender.current({
      type: 'update-version-selection',
      packageId: currentPackageId,
      data: { oracleId, scryfallId }
    });
    // No immediate API fetch here; rely on WebSocket event for authoritative update
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