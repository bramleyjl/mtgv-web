import { NextRequest, NextResponse } from 'next/server';
import { cardSearchCache, generateSearchCacheKey } from '@/lib/cache';

const MTGV_API_BASE_URL = process.env.MTGV_API_BASE_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const uniqueNamesOnly = searchParams.get('unique_names_only') !== 'false';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "query" is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = generateSearchCacheKey(query, uniqueNamesOnly);
    const cachedResult = cardSearchCache.get(cacheKey);
    
    if (cachedResult) {
      console.debug(`API cache hit for search: ${query}`);
      return NextResponse.json(cachedResult);
    }

    console.debug(`API cache miss for search: ${query}`);

    // Build the URL for the MTGV API
    const mtgvApiUrl = new URL('/cards', MTGV_API_BASE_URL);
    mtgvApiUrl.searchParams.set('query', query);
    mtgvApiUrl.searchParams.set('unique_names_only', uniqueNamesOnly.toString());

    const response = await fetch(mtgvApiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`MTGV API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result
    cardSearchCache.set(cacheKey, data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Card search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search cards' },
      { status: 500 }
    );
  }
} 