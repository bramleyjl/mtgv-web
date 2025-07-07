import { 
  validateCardName, 
  validateCardList, 
  formatCardName
} from './validation';

describe('validation utilities', () => {
  describe('validateCardName', () => {
    it('should validate valid card names', () => {
      expect(validateCardName('Lightning Bolt')).toEqual({ isValid: true });
      expect(validateCardName('Black Lotus')).toEqual({ isValid: true });
    });

    it('should reject empty card names', () => {
      expect(validateCardName('')).toEqual({ 
        isValid: false, 
        error: 'Card name is required' 
      });
      expect(validateCardName('   ')).toEqual({ 
        isValid: false, 
        error: 'Card name is required' 
      });
    });

    it('should reject card names that are too short', () => {
      expect(validateCardName('A')).toEqual({ 
        isValid: false, 
        error: 'Card name must be at least 2 characters long' 
      });
    });

    it('should reject card names that are only numbers', () => {
      expect(validateCardName('123')).toEqual({ 
        isValid: false, 
        error: 'Card name must contain at least one letter' 
      });
    });

    it('should reject card names without any alphabet characters', () => {
      expect(validateCardName('123')).toEqual({ 
        isValid: false, 
        error: 'Card name must contain at least one letter' 
      });
      expect(validateCardName('!!!')).toEqual({ 
        isValid: false, 
        error: 'Card name must contain at least one letter' 
      });
      expect(validateCardName('123!!!')).toEqual({ 
        isValid: false, 
        error: 'Card name must contain at least one letter' 
      });
    });

    it('should accept card names with at least one letter', () => {
      expect(validateCardName('a123')).toEqual({ isValid: true });
      expect(validateCardName('123a')).toEqual({ isValid: true });
      expect(validateCardName('!a!')).toEqual({ isValid: true });
    });
  });

  describe('validateCardList', () => {
    it('should validate empty card list', () => {
      expect(validateCardList([])).toEqual({ isValid: true, totalCards: 0 });
    });

    it('should validate card list within limit', () => {
      const cards = [
        { name: 'Lightning Bolt', quantity: 4 },
        { name: 'Black Lotus', quantity: 1 }
      ];
      expect(validateCardList(cards)).toEqual({ isValid: true, totalCards: 5 });
    });

    it('should reject card list exceeding 100 cards', () => {
      const cards = [
        { name: 'Lightning Bolt', quantity: 50 },
        { name: 'Black Lotus', quantity: 51 }
      ];
      expect(validateCardList(cards)).toEqual({ 
        isValid: false, 
        error: 'Total cards (101) exceeds the limit of 100 cards',
        totalCards: 101
      });
    });

    it('should handle cards with undefined quantity', () => {
      const cards = [
        { name: 'Lightning Bolt', quantity: undefined as any },
        { name: 'Black Lotus', quantity: 1 }
      ];
      expect(validateCardList(cards)).toEqual({ isValid: true, totalCards: 2 });
    });
  });

  describe('formatCardName', () => {
    it('should capitalize first letter of each word', () => {
      expect(formatCardName('lightning bolt')).toBe('Lightning Bolt');
      expect(formatCardName('black lotus')).toBe('Black Lotus');
    });

    it('should handle single word', () => {
      expect(formatCardName('counterspell')).toBe('Counterspell');
    });

    it('should handle empty string', () => {
      expect(formatCardName('')).toBe('');
    });

    it('should handle already capitalized names', () => {
      expect(formatCardName('Lightning Bolt')).toBe('Lightning Bolt');
    });
  });
}); 