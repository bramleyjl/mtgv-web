'use client';

import React from 'react';
import { useExport } from '@/hooks/useExport';

interface ExportButtonsProps {
  packageId: string | undefined;
  disabled?: boolean;
}

export default function ExportButtons({ packageId, disabled = false }: ExportButtonsProps) {
  const { exportLoading, exportError, exportSuccess, exportTCGPlayer, exportText, clearExportError, clearExportSuccess } = useExport();

  const handleTCGPlayerExport = async () => {
    if (!packageId) return;
    await exportTCGPlayer(packageId);
  };

  const handleTextExport = async () => {
    if (!packageId) return;
    await exportText(packageId);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* TCGPlayer Export Button */}
      <button
        onClick={handleTCGPlayerExport}
        disabled={disabled || exportLoading || !packageId}
        className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {exportLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Export to TCGPlayer
          </>
        )}
      </button>

      {/* Text Export Button */}
      <button
        onClick={handleTextExport}
        disabled={disabled || exportLoading || !packageId}
        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {exportLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Copy as Text
          </>
        )}
      </button>

      {/* Success Display */}
      {exportSuccess && (
        <div className="col-span-full mt-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <div className="flex justify-between items-start">
            <span className="text-sm">{exportSuccess}</span>
            <button
              onClick={clearExportSuccess}
              className="ml-2 text-green-500 hover:text-green-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {exportError && (
        <div className="col-span-full mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-start">
            <span className="text-sm">{exportError}</span>
            <button
              onClick={clearExportError}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 