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
  image_uris?: Array<{
    small?: string;
    normal?: string;
    large?: string;
  }>;
  price?: number;
  prices?: {
    usd?: { $numberDecimal: string } | number | null;
    usd_foil?: { $numberDecimal: string } | number | null;
    usd_etched?: { $numberDecimal: string } | number | null;
    eur?: { $numberDecimal: string } | number | null;
    eur_foil?: { $numberDecimal: string } | number | null;
    tix?: { $numberDecimal: string } | number | null;
  };
  set_name?: string;
  collector_number?: string;
  rarity?: string;
}

// Card Package types
export interface CardPackage {
  package_id?: string;
  card_list: Card[];
  game: GameType;
  package_entries: PackageEntry[];
  default_selection: DefaultSelection;
}

export interface PackageEntry {
  count: number;
  oracle_id: string | null;
  name: string;
  card_prints: CardPrint[];
  selected_print: string | null;
  user_selected: boolean;
  not_found?: boolean;
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
  details?: unknown;
}

// Component prop types
export interface CardInputProps {
  onCardListChange: (cards: Card[]) => void;
  cardList: Card[];
}

export interface CardDisplayProps {
  cardPackage: CardPackage | null;
  onVersionSelection: (oracleId: string, scryfallId: string) => void;
  onClearPackage: () => void;
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

// WebSocket types
export interface WebSocketMessage {
  type: string;
  data?: unknown;
  packageId?: string;
}

export interface WebSocketPackageUpdate {
  type: 'card-list-updated' | 'version-selection-updated' | 'joined-package' | 'error';
  data?: unknown;
  packageId?: string;
  error?: string;
}

// Hook return types
export interface UseCardPackageReturn {
  cardPackage: CardPackage | null;
  loading: boolean;
  error: string | null;
  createCardPackage: (cards: Card[], game?: GameType, defaultSelection?: DefaultSelection) => Promise<void>;
  createRandomPackage: (count: number, game?: GameType, defaultSelection?: DefaultSelection) => Promise<void>;
  updateCardList: (cards: Card[]) => void;
  updateVersionSelection: (oracleId: string, scryfallId: string) => void;
  joinPackage: (packageId: string) => void;
  leavePackage: () => void;
  clearCardPackage: () => void;
  clearError: () => void;
} 