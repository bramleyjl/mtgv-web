'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCardAutocomplete } from '../hooks/useCardAutocomplete';
import { validateCardName } from '../lib/validation';

interface EditableCardNameProps {
  cardName: string;
  onUpdate: (newName: string) => void;
  onCancel: () => void;
}

export default function EditableCardName({ 
  cardName, 
  onUpdate, 
  onCancel
}: EditableCardNameProps) {
  const [name, setName] = useState(cardName);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading, error, searchCards, clearSuggestions } = useCardAutocomplete({
    minLength: 2,
    debounceMs: 300,
    maxResults: 10,
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
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

    setValidationError(null);
    return true;
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: { name: string; id: string }) => {
    if (validateInput(suggestion.name)) {
      setName(suggestion.name);
      onUpdate(suggestion.name);
      setIsEditing(false);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      clearSuggestions();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
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
          } else {
            // Submit current value
            if (validateInput(name.trim())) {
              onUpdate(name.trim());
              setIsEditing(false);
              setShowSuggestions(false);
              setSelectedIndex(-1);
              clearSuggestions();
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          onCancel();
          break;
      }
    } else {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (validateInput(name.trim())) {
            onUpdate(name.trim());
            setIsEditing(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onCancel();
          break;
      }
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

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing]);

  // Handle blur
  const handleBlur = () => {
    // Small delay to allow for suggestion clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        if (validateInput(name.trim())) {
          onUpdate(name.trim());
          setIsEditing(false);
          setShowSuggestions(false);
          setSelectedIndex(-1);
          clearSuggestions();
        }
      }
    }, 100);
  };

  if (isEditing) {
    return (
      <div className="relative flex-1 min-w-0">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => setShowSuggestions(true)}
          className={`w-full px-2 py-1 bg-gray-600 border rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            validationError ? 'border-red-500' : 'border-gray-500'
          }`}
          autoFocus
        />
        
        {/* Validation error */}
        {validationError && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-400 z-30 bg-gray-800 px-2 py-1 rounded border border-red-500">
            {validationError}
          </div>
        )}
        
        {/* Suggestions dropdown */}
        {showSuggestions && (suggestions.length > 0 || isLoading || error) && (
          <div
            ref={suggestionsRef}
            className="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
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
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-left font-medium text-gray-200 truncate hover:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-inset rounded px-1 py-0.5"
    >
      {cardName}
    </button>
  );
} 