'use client';

import { useState, useEffect } from 'react';

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  size: number;
}

interface CacheData {
  stats: {
    search: CacheStats;
  };
  timestamp: string;
}

export default function CacheMonitor() {
  const [cacheData, setCacheData] = useState<CacheData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCacheStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cache');
      if (!response.ok) {
        throw new Error('Failed to fetch cache stats');
      }
      
      const data = await response.json();
      setCacheData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllCaches = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cache', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to clear caches');
      }
      
      // Refresh stats after clearing
      await fetchCacheStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCacheStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchCacheStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!cacheData) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-2">Cache Monitor</h3>
        {isLoading ? (
          <p className="text-gray-300">Loading cache stats...</p>
        ) : error ? (
          <p className="text-red-400">Error: {error}</p>
        ) : (
          <p className="text-gray-300">No cache data available</p>
        )}
      </div>
    );
  }

  const { stats } = cacheData;
  const totalHits = stats.search.hits;
  const totalMisses = stats.search.misses;
  const totalKeys = stats.search.keys;
  const hitRate = totalHits + totalMisses > 0 ? ((totalHits / (totalHits + totalMisses)) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Cache Monitor</h3>
        <div className="flex gap-2">
          <button
            onClick={fetchCacheStats}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            onClick={clearAllCaches}
            disabled={isLoading}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-700 rounded p-3">
          <div className="text-2xl font-bold text-green-400">{hitRate}%</div>
          <div className="text-sm text-gray-300">Hit Rate</div>
        </div>
        <div className="bg-gray-700 rounded p-3">
          <div className="text-2xl font-bold text-blue-400">{totalHits}</div>
          <div className="text-sm text-gray-300">Total Hits</div>
        </div>
        <div className="bg-gray-700 rounded p-3">
          <div className="text-2xl font-bold text-yellow-400">{totalMisses}</div>
          <div className="text-sm text-gray-300">Total Misses</div>
        </div>
        <div className="bg-gray-700 rounded p-3">
          <div className="text-2xl font-bold text-purple-400">{totalKeys}</div>
          <div className="text-sm text-gray-300">Total Keys</div>
        </div>
      </div>

      <div className="bg-gray-700 rounded p-3">
        <h4 className="font-semibold text-white mb-2">Search Cache</h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-gray-300">Hits:</span>
            <span className="text-green-400 ml-1">{stats.search.hits}</span>
          </div>
          <div>
            <span className="text-gray-300">Misses:</span>
            <span className="text-yellow-400 ml-1">{stats.search.misses}</span>
          </div>
          <div>
            <span className="text-gray-300">Keys:</span>
            <span className="text-blue-400 ml-1">{stats.search.keys}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Last updated: {new Date(cacheData.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
} 