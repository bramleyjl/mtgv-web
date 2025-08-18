import {
  parseDeckList,
  generateDeckList,
  validateDeckList,
  SUPPORTED_FORMATS,
  type ParsedCard
} from './deckListParser';

describe('deckListParser', () => {
  describe('SUPPORTED_FORMATS', () => {
    it('contains all expected formats', () => {
      expect(SUPPORTED_FORMATS).toHaveLength(4);
      expect(SUPPORTED_FORMATS.map(f => f.name)).toEqual(['simple', 'arena', 'mtgo', 'plain']);
    });

    it('has proper format descriptions', () => {
      const simpleFormat = SUPPORTED_FORMATS.find(f => f.name === 'simple');
      expect(simpleFormat?.description).toBe('Simple format: "4x Lightning Bolt"');
      expect(simpleFormat?.example).toBe('4x Lightning Bolt\n2x Counterspell');
    });
  });

  describe('parseDeckList', () => {
    it('returns empty array for empty input', () => {
      expect(parseDeckList('')).toEqual([]);
      expect(parseDeckList('   ')).toEqual([]);
      expect(parseDeckList(null as unknown as string)).toEqual([]);
      expect(parseDeckList(undefined as unknown as string)).toEqual([]);
    });

    it('ignores comment lines', () => {
      const input = `
        // This is a comment
        4x Lightning Bolt
        // Another comment
        2x Counterspell
      `;
      const result = parseDeckList(input);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Lightning Bolt');
      expect(result[1].name).toBe('Counterspell');
    });

    it('ignores empty lines', () => {
      const input = `
        4x Lightning Bolt


        2x Counterspell
      `;
      const result = parseDeckList(input);
      expect(result).toHaveLength(2);
    });

    it('parses simple format (4x Card Name)', () => {
      const input = '4x Lightning Bolt\n2x Counterspell';
      const result = parseDeckList(input);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Lightning Bolt',
        quantity: 4
      });
      expect(result[1]).toEqual({
        name: 'Counterspell',
        quantity: 2
      });
    });

    it('parses arena format (4 Card Name (Set) 123)', () => {
      const input = '4 Lightning Bolt (M10) 133\n2 Counterspell (M10) 50';
      const result = parseDeckList(input);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Lightning Bolt',
        quantity: 4,
        set: 'M10',
        collectorNumber: '133'
      });
      expect(result[1]).toEqual({
        name: 'Counterspell',
        quantity: 2,
        set: 'M10',
        collectorNumber: '50'
      });
    });

    it('parses MTGO format (4 [Set] Card Name)', () => {
      const input = '4 [M10] Lightning Bolt\n2 [M10] Counterspell';
      const result = parseDeckList(input);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Lightning Bolt',
        quantity: 4,
        set: 'M10'
      });
      expect(result[1]).toEqual({
        name: 'Counterspell',
        quantity: 2,
        set: 'M10'
      });
    });

    it('parses plain format (4 Card Name)', () => {
      const input = '4 Lightning Bolt\n2 Counterspell';
      const result = parseDeckList(input);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Lightning Bolt',
        quantity: 4
      });
      expect(result[1]).toEqual({
        name: 'Counterspell',
        quantity: 2
      });
    });

    it('handles mixed formats in same input', () => {
      const input = '4x Lightning Bolt\n2 Counterspell (M10) 50\n3 [M10] Fireball';
      const result = parseDeckList(input);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'Lightning Bolt', quantity: 4 });
      expect(result[1]).toEqual({ name: 'Counterspell', quantity: 2, set: 'M10', collectorNumber: '50' });
      expect(result[2]).toEqual({ name: 'Fireball', quantity: 3, set: 'M10' });
    });

    it('handles edge cases gracefully', () => {
      const input = '0 Lightning Bolt\n-1 Counterspell\n999 Fireball';
      const result = parseDeckList(input);
      
      expect(result).toHaveLength(3);
      expect(result[0].quantity).toBe(0);
      expect(result[1].quantity).toBe(-1);
      expect(result[2].quantity).toBe(999);
    });
  });

  describe('generateDeckList', () => {
    const sampleCards: ParsedCard[] = [
      { name: 'Lightning Bolt', quantity: 4, set: 'M10', collectorNumber: '133' },
      { name: 'Counterspell', quantity: 2, set: 'M10', collectorNumber: '50' }
    ];

    it('generates simple format correctly', () => {
      const result = generateDeckList(sampleCards, 'simple');
      expect(result).toBe('4x Lightning Bolt\n2x Counterspell');
    });

    it('generates arena format correctly', () => {
      const result = generateDeckList(sampleCards, 'arena');
      expect(result).toBe('4 Lightning Bolt (M10) 133\n2 Counterspell (M10) 50');
    });

    it('generates MTGO format correctly', () => {
      const result = generateDeckList(sampleCards, 'mtgo');
      expect(result).toBe('4 [M10] Lightning Bolt\n2 [M10] Counterspell');
    });

    it('generates plain format correctly', () => {
      const result = generateDeckList(sampleCards, 'plain');
      expect(result).toBe('4 Lightning Bolt\n2 Counterspell');
    });

    it('handles cards without set information', () => {
      const cardsWithoutSet: ParsedCard[] = [
        { name: 'Lightning Bolt', quantity: 4 },
        { name: 'Counterspell', quantity: 2 }
      ];
      
      const arenaResult = generateDeckList(cardsWithoutSet, 'arena');
      expect(arenaResult).toBe('4 Lightning Bolt\n2 Counterspell');
      
      const mtgoResult = generateDeckList(cardsWithoutSet, 'mtgo');
      expect(mtgoResult).toBe('4 Lightning Bolt\n2 Counterspell');
    });

    it('throws error for unsupported format', () => {
      expect(() => generateDeckList(sampleCards, 'unsupported' as never)).toThrow('Unsupported format: unsupported');
    });

    it('uses simple format as default', () => {
      const result = generateDeckList(sampleCards);
      expect(result).toBe('4x Lightning Bolt\n2x Counterspell');
    });
  });

  describe('validateDeckList', () => {
    it('returns valid for empty list', () => {
      const result = validateDeckList([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Deck list is empty');
    });

    it('returns valid for valid deck list', () => {
      const validCards: ParsedCard[] = [
        { name: 'Lightning Bolt', quantity: 4 },
        { name: 'Counterspell', quantity: 2 }
      ];
      
      const result = validateDeckList(validCards);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('detects deck list exceeding 100 entries', () => {
      const manyCards = Array.from({ length: 101 }, (_, i) => ({
        name: `Card ${i}`,
        quantity: 1
      }));
      
      const result = validateDeckList(manyCards);
      expect(result.isValid).toBe(true); // Still valid, just a warning
      expect(result.warnings).toContain('Deck list has 101 entries, which exceeds the limit of 100 entries');
    });

    it('detects invalid quantities', () => {
      const invalidCards: ParsedCard[] = [
        { name: 'Lightning Bolt', quantity: 0 },
        { name: 'Counterspell', quantity: -1 },
        { name: 'Fireball', quantity: 101 }
      ];
      
      const result = validateDeckList(invalidCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid quantities found: 0x Lightning Bolt, -1x Counterspell, 101x Fireball');
    });

    it('detects empty card names', () => {
      const invalidCards: ParsedCard[] = [
        { name: 'Lightning Bolt', quantity: 4 },
        { name: '', quantity: 2 },
        { name: '   ', quantity: 3 }
      ];
      
      const result = validateDeckList(invalidCards);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Empty card names found');
    });


  });


});
