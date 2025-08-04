import { useState, useCallback } from 'react';
import { mtgvAPI } from '@/lib/api';

interface UseExportReturn {
  exportLoading: boolean;
  exportError: string | null;
  exportSuccess: string | null;
  exportTCGPlayer: (packageId: string) => Promise<void>;
  exportText: (packageId: string) => Promise<void>;
  clearExportError: () => void;
  clearExportSuccess: () => void;
}

export function useExport(): UseExportReturn {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const exportTCGPlayer = useCallback(async (packageId: string) => {
    if (!packageId) {
      setExportError('No package ID provided');
      return;
    }

    setExportLoading(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const response = await mtgvAPI.exportCardPackage(packageId, 'tcgplayer');
      
      // For TCGPlayer, the response contains a URL that we should open
      if (response.export_text && response.export_text.startsWith('http')) {
        window.open(response.export_text, '_blank');
        setExportSuccess('TCGPlayer page opened in new tab');
      } else {
        setExportError('Invalid TCGPlayer export response');
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to export to TCGPlayer');
    } finally {
      setExportLoading(false);
    }
  }, []);

  const exportText = useCallback(async (packageId: string) => {
    if (!packageId) {
      setExportError('No package ID provided');
      return;
    }

    setExportLoading(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const response = await mtgvAPI.exportCardPackage(packageId, 'text');
      
      // For text export, copy to clipboard
      if (response.export_text) {
        try {
          await navigator.clipboard.writeText(response.export_text);
          setExportSuccess('Card list copied to clipboard');
        } catch {
          setExportError('Failed to copy to clipboard. Please copy manually.');
          // Fallback: show the text in an alert or modal
          alert('Export text:\n\n' + response.export_text);
        }
      } else {
        setExportError('No export text received');
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to export as text');
    } finally {
      setExportLoading(false);
    }
  }, []);

  const clearExportError = useCallback(() => {
    setExportError(null);
  }, []);

  const clearExportSuccess = useCallback(() => {
    setExportSuccess(null);
  }, []);

  return {
    exportLoading,
    exportError,
    exportSuccess,
    exportTCGPlayer,
    exportText,
    clearExportError,
    clearExportSuccess,
  };
} 