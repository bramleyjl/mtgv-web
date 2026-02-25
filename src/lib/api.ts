import {
  Card,
  GameType,
  DefaultSelection,
  CardPackage,
  CreateCardPackageResponse,
  RandomPackageResponse,
  ExportResponse,
  ExportType,
} from '@/types';

// Enhanced error types for better error handling
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface APIErrorResponse {
  error: string;
  details?: string;
  type?: string;
  validationErrors?: ValidationError[];
}

export class MTGVAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown,
    public validationErrors?: ValidationError[],
    public isNetworkError: boolean = false,
    public isTimeoutError: boolean = false,
    public isServerError: boolean = false
  ) {
    super(message);
    this.name = 'MTGVAPIError';
  }
}

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Helper to create a timeout promise
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
}

// Helper to make fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
  try {
    return await Promise.race([
      fetch(url, options),
      createTimeoutPromise(timeout)
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === 'Request timeout') {
      throw new MTGVAPIError(
        'Request timed out. The server may be processing a large dataset. Please try again.',
        0,
        undefined,
        undefined,
        false,
        true,
        false
      );
    }
    // Network errors
    if (error instanceof TypeError) {
      throw new MTGVAPIError(
        'Network error. Please check your internet connection and try again.',
        0,
        error,
        undefined,
        true,
        false,
        false
      );
    }
    throw error;
  }
}

// All requests go through Next.js API routes (e.g., /api/cards/search, /api/cards/package)

class MTGVAPIService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: APIErrorResponse;

      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: `Request failed with status ${response.status}`,
          details: response.statusText
        };
      }

      // Create a more descriptive error message based on status code
      let errorMessage = errorData.error || 'Request failed';
      const isServerError = response.status >= 500;

      // Add context based on status code
      if (response.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (response.status === 503) {
        errorMessage = 'Service temporarily unavailable. Please try again in a few moments.';
      } else if (response.status === 404) {
        errorMessage = 'Resource not found. ' + (errorData.details || '');
      } else if (errorData.details) {
        errorMessage += `: ${errorData.details}`;
      }

      // Handle validation errors specifically
      if (errorData.validationErrors && errorData.validationErrors.length > 0) {
        const validationMessages = errorData.validationErrors
          .map((err: { field: string; message: string }) => `${err.field}: ${err.message}`)
          .join(', ');
        errorMessage = `Validation errors: ${validationMessages}`;
      }

      throw new MTGVAPIError(
        errorMessage,
        response.status,
        errorData.details,
        errorData.validationErrors,
        false,
        false,
        isServerError
      );
    }

    return response.json();
  }

  // Card search via API route
  async searchCards(query: string, uniqueNamesOnly: boolean = true): Promise<string[]> {
    const params = new URLSearchParams({
      query,
      unique_names_only: uniqueNamesOnly.toString(),
    });
    const res = await fetchWithTimeout(`/api/cards/search?${params.toString()}`);
    const data = await this.handleResponse<{ cards: string[] }>(res);
    return data.cards;
  }

  // Create card package
  async createCardPackage(
    cardList: Card[],
    game: GameType = 'paper',
    defaultSelection: DefaultSelection = 'newest',
    packageId?: string
  ): Promise<CardPackage> {
    if (!cardList || cardList.length === 0) {
      throw new MTGVAPIError('Card list cannot be empty', 400);
    }

    if (cardList.length > 100) {
      throw new MTGVAPIError('Card list cannot exceed 100 cards', 400);
    }

    const body: Record<string, unknown> = {
      card_list: cardList,
      game,
      default_selection: defaultSelection
    };
    if (packageId) {
      body.package_id = packageId;
    }
    const res = await fetchWithTimeout('/api/card_packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, 45000); // Longer timeout for package creation

    const data: CreateCardPackageResponse = await this.handleResponse(res);
    return data.card_package;
  }

  // Random package generation
  async createRandomPackage(
    count: number,
    game: GameType = 'paper',
    defaultSelection: DefaultSelection = 'newest'
  ): Promise<CardPackage> {
    if (count <= 0 || count > 100) {
      throw new MTGVAPIError('Count must be between 1 and 100', 400);
    }

    const params = new URLSearchParams({
      count: count.toString(),
      game,
      default_selection: defaultSelection,
    });
    const res = await fetchWithTimeout(`/api/card_packages/random?${params.toString()}`);
    const data: RandomPackageResponse = await this.handleResponse(res);
    return data.card_package;
  }

  // Export card package
  async exportCardPackage(
    packageId: string,
    exportType: ExportType = 'tcgplayer'
  ): Promise<ExportResponse> {
    if (!packageId) {
      throw new MTGVAPIError('Package ID is required for export', 400);
    }

    const params = new URLSearchParams({
      type: exportType,
    });
    const res = await fetchWithTimeout(`/api/card_packages/export?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_id: packageId }),
    });
    return this.handleResponse(res);
  }

  // Fetch card package by ID
  async getCardPackage(packageId: string): Promise<CardPackage> {
    if (!packageId) {
      throw new MTGVAPIError('Package ID is required', 400);
    }

    const url = `/api/card_packages/${packageId}`;
    const res = await fetchWithTimeout(url);
    const data: CreateCardPackageResponse = await this.handleResponse(res);
    return data.card_package;
  }
}

export const mtgvAPI = new MTGVAPIService();
