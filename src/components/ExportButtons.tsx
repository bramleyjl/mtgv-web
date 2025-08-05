'use client';

import React, { useState } from 'react';
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
    <div className="export-container">
      {/* TCGPlayer Export Button */}
      <button
        onClick={handleTCGPlayerExport}
        disabled={disabled || exportLoading || !packageId}
        className="btn-export-tcgplayer"
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
        className="btn-export-text"
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
        <div className="export-success">
          <div className="flex-between">
            <span className="export-message">{exportSuccess}</span>
            <button
              onClick={clearExportSuccess}
              className="export-dismiss"
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
        <div className="export-error">
          <div className="flex-between">
            <span className="export-message">{exportError}</span>
            <button
              onClick={clearExportError}
              className="export-dismiss-error"
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