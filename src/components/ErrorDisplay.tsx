import React from 'react';

export interface ErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
  className?: string;
}

export default function ErrorDisplay({ 
  error, 
  onDismiss, 
  type = 'error',
  className = '' 
}: ErrorDisplayProps) {
  if (!error) return null;

  const getErrorStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-900 border-yellow-700 text-yellow-200';
      case 'info':
        return 'bg-blue-900 border-blue-700 text-blue-200';
      default:
        return 'bg-red-900 border-red-700 text-red-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  return (
    <div className={`error-container ${getErrorStyles()} ${className}`}>
      <div className="error-content">
        <div className="flex-start gap-small">
          <span className="error-icon">{getIcon()}</span>
          <div className="flex-1">
            <p className="error-text">{error}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="error-dismiss"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
} 