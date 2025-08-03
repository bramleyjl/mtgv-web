import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const count = searchParams.get('count');
    const game = searchParams.get('game') || 'paper';
    const defaultSelection = searchParams.get('default_selection') || 'oldest';

    // Validate required parameters
    if (!count) {
      return NextResponse.json(
        { error: 'Missing required parameter: count' },
        { status: 400 }
      );
    }

    // Validate count is a positive number
    const countNum = parseInt(count);
    if (isNaN(countNum) || countNum <= 0) {
      return NextResponse.json(
        { error: 'Count must be a positive number' },
        { status: 400 }
      );
    }

    // Build backend API URL
    const backendUrl = process.env.MTGV_API_URL || 'http://localhost:4000';
    const apiUrl = `${backendUrl}/card_package/random?count=${countNum}&game=${game}&default_selection=${defaultSelection}`;

    // Forward request to backend
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Random package API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 