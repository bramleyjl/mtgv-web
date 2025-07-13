import { NextRequest, NextResponse } from 'next/server';

const MTGV_API_BASE_URL = process.env.MTGV_API_BASE_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Build the URL for the MTGV API
    const mtgvApiUrl = new URL('/card_package', MTGV_API_BASE_URL);

    const response = await fetch(mtgvApiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('MTGV API error:', response.status, response.statusText, errorData);
      
      return NextResponse.json(
        { 
          error: 'Failed to create card package',
          details: errorData.error || response.statusText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Card package API error:', error);
    return NextResponse.json(
      { error: 'Failed to create card package' },
      { status: 500 }
    );
  }
} 