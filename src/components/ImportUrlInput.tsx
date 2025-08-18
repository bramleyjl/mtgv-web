'use client';

import React from 'react';

interface ImportUrlInputProps {
  className?: string;
}

export default function ImportUrlInput({ className = '' }: ImportUrlInputProps) {
  return (
    <div className={`import-url-input ${className}`}>
      <div className="import-url-content">
        <h3 className="import-url-title">Import from URL</h3>
        <p className="import-url-description">
          This feature will allow you to import deck lists from popular deck building websites.
        </p>
        
        <div className="import-url-placeholder">
          <div className="placeholder-icon">🔗</div>
          <h4>Coming Soon</h4>
          <p>URL import functionality will be implemented in a future update.</p>
          <p>Supported sources will include:</p>
          <ul className="supported-sources">
            <li>TCGPlayer</li>
            <li>Moxfield</li>
            <li>Archidekt</li>
            <li>Deckstats.net</li>
            <li>MTGGoldfish</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
