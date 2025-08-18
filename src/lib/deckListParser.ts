/**
 * Deck List Parser and Formatter
 * Handles parsing deck lists from various formats and generating formatted output
 */

export interface ParsedCard {
  name: string;
  quantity: number;
  set?: string;
  collectorNumber?: string;
}

export interface DeckListFormat {
  name: string;
  description: string;
  example: string;
}

/**
 * Supported deck list formats
 */
export const SUPPORTED_FORMATS: DeckListFormat[] = [
  {
    name: 'simple',
    description: 'Simple format: "4x Lightning Bolt"',
    example: '4x Lightning Bolt\n2x Counterspell'
  },
  {
    name: 'arena',
    description: 'Arena format: "4 Lightning Bolt (M10) 133"',
    example: '4 Lightning Bolt (M10) 133\n2 Counterspell (M10) 50'
  },
  {
    name: 'mtgo',
    description: 'MTGO format: "4 [M10] Lightning Bolt"',
    example: '4 [M10] Lightning Bolt\n2 [M10] Counterspell'
  },
  {
    name: 'plain',
    description: 'Plain text: "4 Lightning Bolt"',
    example: '4 Lightning Bolt\n2 Counterspell'
  }
];

/**
 * Parse a deck list string into structured card data
 */
export function parseDeckList(input: string): ParsedCard[] {
  if (!input || typeof input !== 'string') {
    return [];
  }

  const lines = input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('//'));

  return lines
    .map(line => parseDeckListLine(line))
    .filter(card => card !== null) as ParsedCard[];
}

/**
 * Parse a single deck list line
 */
function parseDeckListLine(line: string): ParsedCard | null {
  // Try different formats in order of specificity
  
  // Arena format: "4 Lightning Bolt (M10) 133"
  const arenaMatch = line.match(/^(\d+)\s+(.+?)\s+\(([^)]+)\)\s+(\d+)$/);
  if (arenaMatch) {
    return {
      name: arenaMatch[2].trim(),
      quantity: parseInt(arenaMatch[1]),
      set: arenaMatch[3].trim(),
      collectorNumber: arenaMatch[4].trim()
    };
  }

  // MTGO format: "4 [M10] Lightning Bolt"
  const mtgoMatch = line.match(/^(\d+)\s+\[([^\]]+)\]\s+(.+)$/);
  if (mtgoMatch) {
    return {
      name: mtgoMatch[3].trim(),
      quantity: parseInt(mtgoMatch[1]),
      set: mtgoMatch[2].trim()
    };
  }

  // Simple format: "4x Lightning Bolt"
  const simpleMatch = line.match(/^(\d+)x\s+(.+)$/);
  if (simpleMatch) {
    return {
      name: simpleMatch[2].trim(),
      quantity: parseInt(simpleMatch[1])
    };
  }

  // Plain format: "4 Lightning Bolt"
  const plainMatch = line.match(/^(\d+)\s+(.+)$/);
  if (plainMatch) {
    return {
      name: plainMatch[2].trim(),
      quantity: parseInt(plainMatch[1])
    };
  }

  // If no format matches, try to extract quantity and name (including negative numbers)
  const fallbackMatch = line.match(/^(-?\d+)\s+(.+)$/);
  if (fallbackMatch) {
    return {
      name: fallbackMatch[2].trim(),
      quantity: parseInt(fallbackMatch[1])
    };
  }

  return null;
}

/**
 * Generate a formatted deck list string
 */
export function generateDeckList(
  cards: Array<{ name: string; quantity: number; set?: string; collectorNumber?: string }>,
  format: keyof typeof FORMAT_GENERATORS = 'simple'
): string {
  const generator = FORMAT_GENERATORS[format];
  if (!generator) {
    throw new Error(`Unsupported format: ${format}`);
  }

  return cards
    .map(card => generator(card))
    .join('\n');
}

/**
 * Format generators for different output formats
 */
const FORMAT_GENERATORS = {
  simple: (card: ParsedCard) => `${card.quantity}x ${card.name}`,
  
  arena: (card: ParsedCard) => {
    if (card.set && card.collectorNumber) {
      return `${card.quantity} ${card.name} (${card.set}) ${card.collectorNumber}`;
    }
    return `${card.quantity} ${card.name}`;
  },
  
  mtgo: (card: ParsedCard) => {
    if (card.set) {
      return `${card.quantity} [${card.set}] ${card.name}`;
    }
    return `${card.quantity} ${card.name}`;
  },
  
  plain: (card: ParsedCard) => `${card.quantity} ${card.name}`
};

/**
 * Validate a parsed deck list
 */
export function validateDeckList(cards: ParsedCard[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (cards.length === 0) {
    errors.push('Deck list is empty');
    return { isValid: false, errors, warnings };
  }

  if (cards.length > 100) {
    warnings.push(`Deck list has ${cards.length} entries, which exceeds the limit of 100 entries`);
  }

  // Check for invalid quantities
  const invalidQuantities = cards.filter(card => card.quantity <= 0 || card.quantity > 100);
  if (invalidQuantities.length > 0) {
    errors.push(`Invalid quantities found: ${invalidQuantities.map(c => `${c.quantity}x ${c.name}`).join(', ')}`);
  }

  // Check for empty card names
  const emptyNames = cards.filter(card => !card.name || card.name.trim().length === 0);
  if (emptyNames.length > 0) {
    errors.push('Empty card names found');
  }



  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
