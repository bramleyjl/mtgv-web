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

      // Create a more descriptive error message
      let errorMessage = errorData.error || 'Request failed';
      
      if (errorData.details) {
        errorMessage += `: ${errorData.details}`;
      }

      // Handle validation errors specifically
      if (errorData.validationErrors && errorData.validationErrors.length > 0) {
        const validationMessages = errorData.validationErrors
          .map((err: { field: string; message: string }) => `${err.field}: ${err.message}`)
          .join(', ');
        errorMessage = `Validation errors: ${validationMessages}`;
      }

      const error = new Error(errorMessage);
      (error as unknown as { status?: number }).status = response.status;
      (error as unknown as { details?: unknown }).details = errorData.details;
      (error as unknown as { validationErrors?: unknown }).validationErrors = errorData.validationErrors;
      throw error;
    }

    return response.json();
  }

  // Card search via API route
  async searchCards(query: string, uniqueNamesOnly: boolean = true): Promise<string[]> {
    const params = new URLSearchParams({
      query,
      unique_names_only: uniqueNamesOnly.toString(),
    });
    const res = await fetch(`/api/cards/search?${params.toString()}`);
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
    const body: Record<string, unknown> = {
      card_list: cardList,
      game,
      default_selection: defaultSelection
    };
    if (packageId) {
      body.package_id = packageId;
    }
    const res = await fetch('/api/card_packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data: CreateCardPackageResponse = await this.handleResponse(res);
    return data.card_package;
  }

  // Random package generation
  async createRandomPackage(
    count: number,
    game: GameType = 'paper',
    defaultSelection: DefaultSelection = 'newest'
  ): Promise<CardPackage> {
    const params = new URLSearchParams({
      count: count.toString(),
      game,
      default_selection: defaultSelection,
    });
    const res = await fetch(`/api/card_packages/random?${params.toString()}`);
    const data: RandomPackageResponse = await this.handleResponse(res);
    return data.card_package;
  }

  // Export card package
  async exportCardPackage(
    packageId: string,
    exportType: ExportType = 'tcgplayer'
  ): Promise<ExportResponse> {
    const params = new URLSearchParams({
      type: exportType,
    });
    const res = await fetch(`/api/card_packages/export?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_id: packageId }),
    });
    return this.handleResponse(res);
  }

  // Fetch card package by ID
  async getCardPackage(packageId: string): Promise<CardPackage> {
    const url = `/api/card_packages/${packageId}`;
    const res = await fetch(url);
    const data: CreateCardPackageResponse = await this.handleResponse(res);
    return data.card_package;
  }
}

export const mtgvAPI = new MTGVAPIService();
