import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, clearAllCaches } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const stats = getCacheStats();
    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    clearAllCaches();
    return NextResponse.json({
      message: 'All caches cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache clear API error:', error);
    return NextResponse.json(
      { error: 'Failed to clear caches' },
      { status: 500 }
    );
  }
} 