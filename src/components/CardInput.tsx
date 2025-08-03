'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCardAutocomplete } from '../hooks/useCardAutocomplete';
import { validateCardName } from '../lib/validation';

interface CardInputProps {
  onAddCard: (cardName: string, quantity: number) => void;
  currentCards?: Array<{ name: string; quantity: number }>;
  validateCardList?: (cards: Array<{ name: string; quantity: number }>) => { isValid: boolean; error?: string; totalCards?: number };
}

export default function CardInput({ onAddCard, currentCards = [], validateCardList }: CardInputProps) {
  const [cardName, setCardName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading, error, searchCards, clearSuggestions } = useCardAutocomplete({
    minLength: 2,
    debounceMs: 300,
    maxResults: 15,
  });

  // Check if adding the current card would exceed the limit
  const wouldExceedLimit = (quantity: number): boolean => {
    if (!validateCardList) return false;
    
    const newCards = [...currentCards, { name: cardName, quantity }];
    const validation = validateCardList(newCards);
    return !validation.isValid;
  };

  // Get the maximum quantity that can be added without exceeding the limit
  const getMaxQuantityForCard = (): number => {
    if (!validateCardList) return 100;
    
    const currentTotal = currentCards.reduce((sum, card) => sum + (card.quantity || 1), 0);
    const remainingSlots = 100 - currentTotal;
    return Math.max(1, Math.min(100, remainingSlots));
  };

  // Quantity control functions
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

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCardName(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    setValidationError(null); // Clear validation error when typing
    
    if (value.trim()) {
      searchCards(value);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  };

  // Validate card name
  const validateInput = (name: string): boolean => {
    const nameValidation = validateCardName(name);
    if (!nameValidation.isValid) {
      setValidationError(nameValidation.error || 'Invalid card name');
      return false;
    }

    // Check if adding this card would exceed the limit
    if (wouldExceedLimit(quantity)) {
      const maxQuantity = getMaxQuantityForCard();
      setValidationError(`Cannot add ${quantity} copies. Maximum allowed: ${maxQuantity} (would exceed 100-card limit)`);
      return false;
    }

    setValidationError(null);
    return true;
  };

  // Show validation error immediately when cardName or quantity changes
  useEffect(() => {
    if (cardName.trim()) {
      validateInput(cardName.trim());
    } else {
      setValidationError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardName, quantity, currentCards]);

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: { name: string; id: string }) => {
    if (validateInput(suggestion.name)) {
      // Add the card directly to the list
      onAddCard(suggestion.name, quantity);
      
      // Reset the form
      setCardName('');
      setQuantity(1);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      clearSuggestions();
      inputRef.current?.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : 0;
        setSelectedIndex(nextIndex);
        scrollToSuggestion(nextIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : suggestions.length - 1;
        setSelectedIndex(prevIndex);
        scrollToSuggestion(prevIndex);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else if (cardName.trim()) {
          // If no suggestion is selected, submit the form
          handleSubmit(e as React.KeyboardEvent);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        clearSuggestions();
        break;
    }
  };

  // Scroll to suggestion when using keyboard navigation
  const scrollToSuggestion = (index: number) => {
    if (suggestionsRef.current) {
      const suggestionElements = suggestionsRef.current.querySelectorAll('button');
      const targetElement = suggestionElements[index];
      if (targetElement) {
        targetElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardName.trim() && validateInput(cardName.trim())) {
      onAddCard(cardName.trim(), quantity);
      setCardName('');
      setQuantity(1);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      clearSuggestions();
    }
  };

  // Handle clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if submit should be disabled
  const isSubmitDisabled = !cardName.trim() || !!validationError || wouldExceedLimit(quantity);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <label htmlFor="cardName" className="block text-sm font-medium text-gray-200 mb-1">
              Card Name
            </label>
            <input
              ref={inputRef}
              type="text"
              id="cardName"
              value={cardName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Enter card name..."
              className={`w-full px-3 py-2 bg-gray-700 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 ${
                validationError ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            
            {/* Validation error */}
            {validationError && (
              <div className="mt-1 text-sm text-red-400">
                {validationError}
              </div>
            )}
            
            {/* Suggestions dropdown */}
            {showSuggestions && (suggestions.length > 0 || isLoading || error) && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-80 overflow-y-auto"
              >
                {isLoading && (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    Searching...
                  </div>
                )}
                
                {error && (
                  <div className="px-3 py-2 text-sm text-red-400">
                    {error}
                  </div>
                )}
                
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`w-full text-left px-3 py-2 text-sm focus:outline-none text-gray-200 ${
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
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-200 mb-1">
              Qty
            </label>
            <div className="flex items-center border border-gray-600 rounded-md bg-gray-700">
              <button
                type="button"
                onClick={handleDecreaseQuantity}
                disabled={quantity <= 1}
                className="px-2 py-2 text-gray-300 hover:text-white disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-10 text-center border-none focus:outline-none focus:ring-0 text-sm bg-gray-700 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              
              <button
                type="button"
                onClick={handleIncreaseQuantity}
                disabled={quantity >= getMaxQuantityForCard()}
                className="px-2 py-2 text-gray-300 hover:text-white disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Card Manually
        </button>
      </form>
    </div>
  );
} 