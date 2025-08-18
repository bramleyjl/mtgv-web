'use client';

import React, { useState, useCallback } from 'react';
import { 
  parseDeckList, 
  generateDeckList, 
  validateDeckList, 
  SUPPORTED_FORMATS
} from '@/lib/deckListParser';
import { copyToClipboard } from '@/lib/clipboard';

interface FreeTextInputProps {
  onImportCards: (cards: Array<{ name: string; quantity: number }>) => void;
  onCreatePackage: (cards: Array<{ name: string; count: number }>) => void;
  className?: string;
}

export default function FreeTextInput({ 
  onImportCards, 
  onCreatePackage,
  className = '' 
}: FreeTextInputProps) {
  const [inputText, setInputText] = useState('');
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [copyFormat, setCopyFormat] = useState<'simple' | 'arena' | 'mtgo' | 'plain'>('simple');
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [copyResult, setCopyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Validate input text as it changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    
    if (text.trim()) {
      const parsedCards = parseDeckList(text);
      const validationResult = validateDeckList(parsedCards);
      setValidation(validationResult);
    } else {
      setValidation(null);
    }
  }, []);

  // Import cards from the input text and create package
  const handleImportCards = useCallback(() => {
    if (!validation?.isValid) return;

    const parsedCards = parseDeckList(inputText);
    
    // Convert to the format expected by the parent component (for onImportCards)
    const convertedCards = parsedCards.map(card => ({
      name: card.name,
      quantity: card.quantity
    }));

    // Convert to the format expected by the API (for onCreatePackage)
    const apiCards = parsedCards.map(card => ({
      name: card.name,
      count: card.quantity
    }));

    // First import the cards to the main list
    onImportCards(convertedCards);
    
    // Then create the package directly from the parsed cards
    onCreatePackage(apiCards);
    
    // Reset input
    setInputText('');
    setValidation(null);
  }, [inputText, validation, onImportCards, onCreatePackage]);

  // Copy current card list to clipboard
  const handleCopy = useCallback(async () => {
    if (!validation?.isValid) {
      setCopyResult({ success: false, message: 'No valid cards to copy' });
      return;
    }

    setIsProcessing(true);
    try {
      const parsedCards = parseDeckList(inputText);
      const formattedList = generateDeckList(parsedCards, copyFormat);
      const result = await copyToClipboard(formattedList);
      
      setCopyResult({
        success: result.success,
        message: result.message
      });

      // Auto-hide success message after 3 seconds
      if (result.success) {
        setTimeout(() => setCopyResult(null), 3000);
      }
    } catch {
      setCopyResult({
        success: false,
        message: 'Failed to copy deck list'
      });
    } finally {
      setIsProcessing(false);
      setShowCopyMenu(false);
    }
  }, [inputText, validation, copyFormat]);

  // Clear all input
  const handleClear = useCallback(() => {
    setInputText('');
    setValidation(null);
    setCopyResult(null);
  }, []);

  return (
    <div className={`free-text-input ${className}`}>
      <div className="input-header">
        <h3 className="input-title">Free Text Input</h3>
        <div className="input-actions">
          <button
            onClick={() => setShowCopyMenu(!showCopyMenu)}
            className="btn-copy"
            disabled={!validation?.isValid}
          >
            📋 Copy
          </button>
          <button
            onClick={handleClear}
            className="btn-clear"
            disabled={!inputText.trim()}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Copy Format Menu */}
      {showCopyMenu && (
        <div className="copy-menu">
          <div className="copy-menu-header">
            <h4>Select Copy Format</h4>
            <button
              onClick={() => setShowCopyMenu(false)}
              className="btn-close"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          
          <div className="copy-formats">
            {SUPPORTED_FORMATS.map((format) => (
              <label key={format.name} className="copy-format-option">
                <input
                  type="radio"
                  name="copyFormat"
                  value={format.name}
                  checked={copyFormat === format.name}
                  onChange={(e) => setCopyFormat(e.target.value as 'simple' | 'arena' | 'mtgo' | 'plain')}
                />
                <div className="format-info">
                  <div className="format-name">{format.description}</div>
                  <div className="format-example">{format.example}</div>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleCopy}
            disabled={isProcessing}
            className="btn-copy-apply"
          >
            {isProcessing ? 'Copying...' : 'Copy to Clipboard'}
          </button>
        </div>
      )}

      {/* Copy Result Message */}
      {copyResult && (
        <div className={`copy-result ${copyResult.success ? 'success' : 'error'}`}>
          {copyResult.message}
        </div>
      )}

      {/* Input Area */}
      <div className="input-area">
        <textarea
          value={inputText}
          onChange={handleInputChange}
          placeholder="Paste or type your deck list here...

Supported formats:

• 4x Lightning Bolt
• 4 Lightning Bolt (M10) 133
• 4 [M10] Lightning Bolt
• 4 Lightning Bolt

You can also mix formats or add comments with //"
          className="deck-list-textarea"
          rows={12}
        />
      </div>

      {/* Validation Results */}
      {validation && (
        <div className="validation-results">
          {validation.errors.length > 0 && (
            <div className="validation-errors">
              <h4>Errors:</h4>
              <ul>
                {validation.errors.map((error, index) => (
                  <li key={index} className="error-item">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="validation-warnings">
              <h4>Warnings:</h4>
              <ul>
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="warning-item">{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.isValid && (
            <div className="validation-success">
              ✅ Deck list is valid and ready to import!
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="import-actions">
        <button
          onClick={handleImportCards}
          disabled={!validation?.isValid || isProcessing}
          className="btn-primary"
        >
          {isProcessing ? 'Importing...' : 'Create Package'}
        </button>
      </div>
    </div>
  );
}
