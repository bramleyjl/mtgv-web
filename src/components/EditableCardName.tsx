'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCardAutocomplete } from '@/hooks/useCardAutocomplete';

interface EditableCardNameProps {
  cardName: string;
  onUpdate: (newName: string) => void;
  onCancel: () => void;
}

export default function EditableCardName({ cardName, onUpdate, onCancel }: EditableCardNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(cardName);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading, error, searchCards } = useCardAutocomplete();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(cardName);
    setValidationError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditValue(value);
    setValidationError(null);
    setSelectedIndex(0);

    if (value.trim().length >= 2) {
      searchCards(value.trim());
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
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

  const handleSuggestionSelect = (suggestion: { name: string; id: string }) => {
    setEditValue(suggestion.name);
    setShowSuggestions(false);
    setSelectedIndex(0);
    setValidationError(null);
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    const trimmedValue = editValue.trim();
    
    if (!trimmedValue) {
      setValidationError('Card name cannot be empty');
      return;
    }

    if (trimmedValue === cardName) {
      setIsEditing(false);
      setValidationError(null);
      return;
    }

    onUpdate(trimmedValue);
    setIsEditing(false);
    setValidationError(null);
    setShowSuggestions(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(cardName);
    setValidationError(null);
    setShowSuggestions(false);
    onCancel();
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

  if (isEditing) {
    return (
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleSubmit}
          onFocus={() => setShowSuggestions(true)}
          className="input-field-large"
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
    <span
      onDoubleClick={handleDoubleClick}
      className="text-left font-medium text-gray-200 truncate hover:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-inset rounded px-1 py-0.5 cursor-pointer"
    >
      {cardName}
    </span>
  );
} 