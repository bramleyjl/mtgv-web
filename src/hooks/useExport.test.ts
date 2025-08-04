import { renderHook, act } from '@testing-library/react';
import { useExport } from './useExport';
import { mtgvAPI } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  mtgvAPI: {
    exportCardPackage: jest.fn(),
  },
}));

const mockMtgvAPI = mtgvAPI as jest.Mocked<typeof mtgvAPI>;

describe('useExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.open
    Object.defineProperty(window, 'open', {
      value: jest.fn(),
      writable: true,
    });
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn(),
      },
      writable: true,
    });
  });

  describe('exportTCGPlayer', () => {
    it('should export to TCGPlayer successfully', async () => {
      const mockResponse = {
        export_text: 'https://tcgplayer.com/list/123',
        type: 'tcgplayer' as const,
      };
      mockMtgvAPI.exportCardPackage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.exportTCGPlayer('test-package-id');
      });

      expect(mockMtgvAPI.exportCardPackage).toHaveBeenCalledWith('test-package-id', 'tcgplayer');
      expect(window.open).toHaveBeenCalledWith('https://tcgplayer.com/list/123', '_blank');
      expect(result.current.exportSuccess).toBe('TCGPlayer page opened in new tab');
    });

    it('should handle TCGPlayer export error', async () => {
      const error = new Error('Export failed');
      mockMtgvAPI.exportCardPackage.mockRejectedValue(error);

      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.exportTCGPlayer('test-package-id');
      });

      expect(result.current.exportError).toBe('Export failed');
    });

    it('should handle invalid TCGPlayer response', async () => {
      const mockResponse = {
        export_text: 'invalid-url',
        type: 'tcgplayer' as const,
      };
      mockMtgvAPI.exportCardPackage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.exportTCGPlayer('test-package-id');
      });

      expect(result.current.exportError).toBe('Invalid TCGPlayer export response');
    });

    it('should handle missing package ID', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.exportTCGPlayer('');
      });

      expect(result.current.exportError).toBe('No package ID provided');
      expect(mockMtgvAPI.exportCardPackage).not.toHaveBeenCalled();
    });
  });

  describe('exportText', () => {
    it('should export text successfully and copy to clipboard', async () => {
      const mockResponse = {
        export_text: '4x Lightning Bolt\n4x Counterspell',
        type: 'text' as const,
      };
      mockMtgvAPI.exportCardPackage.mockResolvedValue(mockResponse);
      (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.exportText('test-package-id');
      });

      expect(mockMtgvAPI.exportCardPackage).toHaveBeenCalledWith('test-package-id', 'text');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('4x Lightning Bolt\n4x Counterspell');
      expect(result.current.exportSuccess).toBe('Card list copied to clipboard');
    });

    it('should handle clipboard error with fallback', async () => {
      const mockResponse = {
        export_text: '4x Lightning Bolt\n4x Counterspell',
        type: 'text' as const,
      };
      mockMtgvAPI.exportCardPackage.mockResolvedValue(mockResponse);
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.exportText('test-package-id');
      });

      expect(result.current.exportError).toBe('Failed to copy to clipboard. Please copy manually.');
      expect(alertSpy).toHaveBeenCalledWith('Export text:\n\n4x Lightning Bolt\n4x Counterspell');
    });

    it('should handle export error', async () => {
      const error = new Error('Export failed');
      mockMtgvAPI.exportCardPackage.mockRejectedValue(error);

      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.exportText('test-package-id');
      });

      expect(result.current.exportError).toBe('Export failed');
    });

    it('should handle missing export text', async () => {
      const mockResponse = {
        export_text: '',
        type: 'text' as const,
      };
      mockMtgvAPI.exportCardPackage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.exportText('test-package-id');
      });

      expect(result.current.exportError).toBe('No export text received');
    });

    it('should handle missing package ID', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.exportText('');
      });

      expect(result.current.exportError).toBe('No package ID provided');
      expect(mockMtgvAPI.exportCardPackage).not.toHaveBeenCalled();
    });
  });

  describe('clearExportError', () => {
    it('should clear export error', () => {
      const { result } = renderHook(() => useExport());

      act(() => {
        result.current.clearExportError();
      });

      expect(result.current.exportError).toBeNull();
    });
  });

  describe('clearExportSuccess', () => {
    it('should clear export success', () => {
      const { result } = renderHook(() => useExport());

      act(() => {
        result.current.clearExportSuccess();
      });

      expect(result.current.exportSuccess).toBeNull();
    });
  });

  describe('loading states', () => {
    it('should set loading state during export', async () => {
      const mockResponse = {
        export_text: 'https://tcgplayer.com/list/123',
        type: 'tcgplayer' as const,
      };
      mockMtgvAPI.exportCardPackage.mockReturnValue(new Promise(resolve => {
        setTimeout(() => resolve(mockResponse), 100);
      }));

      const { result } = renderHook(() => useExport());

      act(() => {
        result.current.exportTCGPlayer('test-package-id');
      });

      expect(result.current.exportLoading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.exportLoading).toBe(false);
    });
  });
}); 