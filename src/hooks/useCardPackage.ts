import { useState, useEffect, useCallback, useRef } from 'react';
import { mtgvAPI } from '@/lib/api';
import { websocketService, createDebouncedSender } from '@/lib/websocket';
import { Card, CardPackage, GameType, DefaultSelection, UseCardPackageReturn, WebSocketMessage } from '@/types';

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

    const handleMessage = (message: any) => {
      switch (message.type) {
        case 'card-list-updated':
          setCardPackage(prev => prev ? { ...prev, card_list: message.data } : null);
          break;
        case 'version-selection-updated':
          setCardPackage(prev => {
            if (!prev) return null;
            const updatedEntries = prev.package_entries.map(entry => {
              if (entry.name === message.data.cardName) {
                return { ...entry, selected_print: message.data.scryfallId };
              }
              return entry;
            });
            return { ...prev, package_entries: updatedEntries };
          });
          break;
        case 'joined-package':
          // Successfully rejoined package room after reconnection
          console.log('Successfully rejoined package room:', message.packageId);
          break;
        case 'error':
          // Handle WebSocket errors
          console.error('WebSocket error:', message.error);
          if (message.error === 'Package not found') {
            // Package was deleted or doesn't exist, clear local state
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
      setError('Real-time updates unavailable');
    });

    return () => {
      websocketService.disconnect();
    };
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

  const updateVersionSelection = useCallback((cardName: string, scryfallId: string) => {
    if (!currentPackageId) return;
    
    // Update local state immediately for responsive UI
    setCardPackage(prev => {
      if (!prev) return null;
      const updatedEntries = prev.package_entries.map(entry => {
        if (entry.name === cardName) {
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
      data: { cardName, scryfallId }
    });
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
      
      // Join the package room for real-time updates
      if (result.id) {
        joinPackage(result.id);
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
      if (result.id) {
        joinPackage(result.id);
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