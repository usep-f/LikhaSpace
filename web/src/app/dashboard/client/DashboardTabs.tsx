'use client';

import React from 'react';

interface DashboardTabsProps {
  active: string;
  onTabChange: (v: string) => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ active, onTabChange }) => {
  const tabs = ['Active Projects', 'Profile', 'History'];
  return (
    <div className="flex space-x-6 border-b border-white/5 mb-8">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onTabChange(t.toLowerCase().replace(' ', '_'))}
          className={`pb-3 font-heading text-xs font-bold tracking-wide uppercase transition-colors ${
            active === t.toLowerCase().replace(' ', '_')
              ? 'text-neoncyan border-b-2 border-neoncyan'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
};
