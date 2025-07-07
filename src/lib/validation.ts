// Frontend-specific validation utilities

/**
 * Validates card name for frontend input (basic UX validation)
 * @param cardName - The card name to validate
 * @returns Validation result with error message if invalid
 */
export function validateCardName(cardName: string): { isValid: boolean; error?: string } {
  if (!cardName || cardName.trim().length === 0) {
    return { isValid: false, error: 'Card name is required' };
  }
  
  const trimmed = cardName.trim();
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Card name must be at least 2 characters long' };
  }
  
  // Reject names without any alphabet character
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Card name must contain at least one letter' };
  }
  
  // Frontend-specific: prevent obviously invalid inputs
  if (/^\d+$/.test(trimmed)) {
    return { isValid: false, error: 'Card name cannot be only numbers' };
  }
  
  return { isValid: true };
}

/**
 * Validates the total card count for the 100-card limit
 * @param cards - Array of cards with quantities
 * @returns Validation result with error message if invalid
 */
export function validateCardList(cards: Array<{ name: string; quantity: number }>): { isValid: boolean; error?: string; totalCards?: number } {
  if (!cards || cards.length === 0) {
    return { isValid: true, totalCards: 0 };
  }
  
  const totalCards = cards.reduce((sum, card) => sum + (card.quantity || 1), 0);
  
  if (totalCards > 100) {
    return { 
      isValid: false, 
      error: `Total cards (${totalCards}) exceeds the limit of 100 cards`,
      totalCards 
    };
  }
  
  return { isValid: true, totalCards };
}

/**
 * Formats a card name for display (capitalizes first letter of each word)
 * @param cardName - The card name to format
 * @returns The formatted card name
 */
export function formatCardName(cardName: string): string {
  if (!cardName) return '';
  
  return cardName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
} 