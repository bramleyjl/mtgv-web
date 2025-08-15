'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCardAutocomplete } from '@/hooks/useCardAutocomplete';
import { validateCardList } from '@/lib/validation';

interface CardInputProps {
  onAddCard: (cardName: string, quantity: number) => void;
  currentCards?: Array<{ name: string; quantity: number }>;
  validateCardList?: (cards: Array<{ name: string; quantity: number }>) => { isValid: boolean; error?: string; entryCount?: number };
}

export default function CardInput({ onAddCard, currentCards = [], validateCardList }: CardInputProps) {
  const [cardName, setCardName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading, error, searchCards, clearSuggestions } = useCardAutocomplete();

  // Check if adding this card would exceed the limit
  const wouldExceedLimit = useCallback((quantity: number): boolean => {
    if (!validateCardList) return false;
    
    const testCards = [...currentCards, { name: cardName.trim(), quantity }];
    const validation = validateCardList(testCards);
    return !validation.isValid;
  }, [currentCards, cardName, validateCardList]);

  // Get the maximum quantity that can be set for this card without exceeding the limit
  const getMaxQuantityForCard = useCallback((): number => {
    if (!validateCardList) return 100;
    
    const otherCardsTotal = currentCards.reduce((sum, card) => sum + (card.quantity || 1), 0);
    const remainingSlots = 100 - otherCardsTotal;
    return Math.max(1, Math.min(100, remainingSlots));
  }, [currentCards, validateCardList]);

  const handleIncreaseQuantity = () => {
    const maxQuantity = getMaxQuantityForCard();
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityChange = (value: string) => {
    // Allow empty string for clearing
    if (value === '') {
      setQuantity(0);
    } else {
      const newQuantity = parseInt(value) || 1;
      const maxQuantity = getMaxQuantityForCard();
      const clampedQuantity = Math.max(1, Math.min(maxQuantity, newQuantity));
      setQuantity(clampedQuantity);
    }
  };

  const handleQuantityBlur = (value: string) => {
    // If empty or invalid, default to 1
    if (value === '' || isNaN(parseInt(value))) {
      setQuantity(1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCardName(value);
    setValidationError(null);
    setSelectedIndex(0);

    if (value.trim().length >= 2) {
      searchCards(value.trim());
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Validate card name input
  const validateInput = (name: string): boolean => {
    if (!name.trim()) {
      setValidationError('Card name is required');
      return false;
    }

    if (name.trim().length < 2) {
      setValidationError('Card name must be at least 2 characters');
      return false;
    }

    // Check if card already exists in the list
    const existingCard = currentCards.find(
      card => card.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existingCard) {
      setValidationError(`"${name.trim()}" is already in your list`);
      return false;
    }

    // Check if adding this card would exceed the limit
    if (wouldExceedLimit(quantity)) {
      if (validateCardList) {
        const testCards = [...currentCards, { name: name.trim(), quantity }];
        const validation = validateCardList(testCards);
        setValidationError(validation.error || 'Cannot add card: would exceed 100-entry limit');
      } else {
        setValidationError('Cannot add card: would exceed 100-entry limit');
      }
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSuggestionSelect = (suggestion: { name: string; id: string }) => {
    setIsSelectingSuggestion(true);
    setCardName(suggestion.name);
    setShowSuggestions(false);
    setSelectedIndex(0);
    setValidationError(null);
    
    // Clear suggestions to ensure dropdown closes immediately
    clearSuggestions();
    
    inputRef.current?.focus();
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setIsSelectingSuggestion(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(0);
        break;
    }
  };

  // Auto-scroll to selected suggestion
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateInput(cardName)) {
      onAddCard(cardName.trim(), quantity);
      setCardName('');
      setQuantity(1);
      setValidationError(null);
      setShowSuggestions(false);
      setSelectedIndex(0);
    }
  };

  // Check if adding this card would exceed the limit and update validation error
  React.useEffect(() => {
    if (cardName.trim() && wouldExceedLimit(quantity)) {
      if (validateCardList) {
        const testCards = [...currentCards, { name: cardName.trim(), quantity }];
        const validation = validateCardList(testCards);
        setValidationError(validation.error || 'Cannot add card: would exceed 100-entry limit');
      } else {
        setValidationError('Cannot add card: would exceed 100-entry limit');
      }
    } else if (validationError && validationError.includes('100-entry limit')) {
      setValidationError(null);
    }
  }, [cardName, quantity, currentCards, validateCardList, validationError]);

  const isSubmitDisabled = !cardName.trim() || !!validationError || wouldExceedLimit(quantity);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="gap-medium">
        <div className="flex flex-col sm:flex-row gap-medium">
          <div className="flex-1 relative">
            <label htmlFor="cardName" className="label">
              Card Name
            </label>
            <input
              ref={inputRef}
              type="text"
              id="cardName"
              value={cardName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (!isSelectingSuggestion) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Enter card name..."
              className={`input-field-large ${
                validationError ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            
            {/* Validation error */}
            {validationError && (
              <div className="text-error text-body-small mt-small">
                {validationError}
              </div>
            )}
            
            {/* Suggestions dropdown */}
            {showSuggestions && (suggestions.length > 0 || isLoading || error) && (
              <div
                ref={suggestionsRef}
                className="autocomplete-dropdown"
              >
                {isLoading && (
                  <div className="autocomplete-item">
                    Searching...
                  </div>
                )}
                
                {error && (
                  <div className="autocomplete-item-error">
                    {error}
                  </div>
                )}
                
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`w-full text-left px-3 py-2 text-sm focus:outline-none text-body-secondary ${
                      index === selectedIndex 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-gray-600'
                    }`}
                  >
                    {suggestion.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="w-full sm:w-28">
            <label htmlFor="quantity" className="label">
              Qty
            </label>
            <div className="input-container">
              <button
                type="button"
                onClick={handleDecreaseQuantity}
                disabled={quantity <= 1}
                className="btn-quantity"
                aria-label="Decrease quantity"
              >
                -
              </button>
              
              <input
                type="number"
                id="quantity"
                value={quantity === 0 ? '' : quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onBlur={(e) => handleQuantityBlur(e.target.value)}
                min="1"
                max={getMaxQuantityForCard()}
                className="input-field"
              />
              
              <button
                type="button"
                onClick={handleIncreaseQuantity}
                disabled={quantity >= getMaxQuantityForCard()}
                className="btn-quantity"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="btn-primary-large"
        >
          Add Card Manually
        </button>
      </form>
    </div>
  );
} 