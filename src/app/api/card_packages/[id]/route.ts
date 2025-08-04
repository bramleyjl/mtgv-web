import { NextResponse } from 'next/server';

const MTGV_API_BASE_URL = process.env.MTGV_API_BASE_URL || 'http://localhost:4000';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json({ error: 'Missing package ID' }, { status: 400 });
  }

  try {
    const mtgvApiUrl = new URL(`/card_package/${id}`, MTGV_API_BASE_URL);
    const response = await fetch(mtgvApiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch card package' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get card package API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card package' },
      { status: 500 }
    );
  }
} 