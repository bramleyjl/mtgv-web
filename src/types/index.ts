// MTGV Web App Type Definitions

// Card-related types
export interface Card {
  name: string;
  count: number;
}

export interface CardPrint {
  scryfall_id: string;
  count: number;
  name?: string;
  image_url?: string;
  price?: number;
  set_name?: string;
  collector_number?: string;
  rarity?: string;
}

// Card Package types
export interface CardPackage {
  cards: CardPrint[];
  total_cards: number;
  total_price?: number;
}

// API Response types
export interface CreateCardPackageResponse {
  card_package: CardPackage;
}

export interface RandomPackageResponse {
  card_package: CardPackage;
}

export interface ExportResponse {
  export_text: string;
  type: 'tcgplayer' | 'text';
}

// API Request types
export interface CreateCardPackageRequest {
  card_list: Card[];
}

export interface ExportRequest {
  selected_prints: CardPrint[];
}

// Game types
export type GameType = 'paper' | 'mtgo' | 'arena';

// Default selection preferences
export type DefaultSelection = 'oldest' | 'newest' | 'most_expensive' | 'least_expensive';

// Export types
export type ExportType = 'tcgplayer' | 'text';

// API Error types
export interface APIError {
  message: string;
  status?: number;
  details?: any;
}

// Component prop types
export interface CardInputProps {
  onCardListChange: (cards: Card[]) => void;
  cardList: Card[];
}

export interface CardDisplayProps {
  cardPackage: CardPackage | null;
  onCardSelectionChange: (selectedPrints: CardPrint[]) => void;
  selectedPrints: CardPrint[];
}

export interface CardVersionProps {
  cardPrint: CardPrint;
  isSelected: boolean;
  onSelect: (cardPrint: CardPrint) => void;
}

// Hook return types
export interface UseCardAutocompleteReturn {
  suggestions: string[];
  loading: boolean;
  error: string | null;
  searchCards: (query: string) => void;
}

export interface UseCardPackageReturn {
  cardPackage: CardPackage | null;
  loading: boolean;
  error: string | null;
  createCardPackage: (cards: Card[], games?: GameType[], defaultSelection?: DefaultSelection) => Promise<void>;
  createRandomPackage: (count: number, games?: GameType[], defaultSelection?: DefaultSelection) => Promise<void>;
} 