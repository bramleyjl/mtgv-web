import { NextRequest, NextResponse } from 'next/server';

const MTGV_API_BASE_URL = process.env.MTGV_API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "query" is required' },
        { status: 400 }
      );
    }

    // Build the URL for the MTGV API
    const mtgvApiUrl = new URL('/cards', MTGV_API_BASE_URL);
    mtgvApiUrl.searchParams.set('query', query);
    mtgvApiUrl.searchParams.set('unique', 'true'); // Default to unique names only for autocomplete

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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Card search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search cards' },
      { status: 500 }
    );
  }
} 