'use client';

import React from 'react';

export type CardListTab = 'manual' | 'freeText' | 'importUrl';

interface CardListTabsProps {
  activeTab: CardListTab;
  onTabChange: (tab: CardListTab) => void;
  className?: string;
}

export default function CardListTabs({ 
  activeTab, 
  onTabChange, 
  className = '' 
}: CardListTabsProps) {
  const tabs = [
    {
      id: 'manual' as const,
      label: 'Manual Entry',
      description: 'Search cards with autocomplete'
    },
    {
      id: 'freeText' as const,
      label: 'Text Input',
      description: 'Paste or type deck lists in bulk'
    },
    {
      id: 'importUrl' as const,
      label: 'Import URL',
      description: 'Import deck lists from external sources'
    }
  ];

  return (
    <div className={`card-list-tabs ${className}`}>
      <div className="tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}
            aria-label={tab.description}
          >
            <span className="tab-label">{tab.label}</span>
            <span className="tab-description">{tab.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
