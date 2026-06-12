import React from 'react';

interface Props {
  active: string;
  onTabChange: (tab: string) => void;
}

export const DashboardTabs: React.FC<Props> = ({ active, onTabChange }) => {
  const tabs = [
    { id: 'active_disputes', label: 'Active Disputes' },
    { id: 'history', label: 'Settlement History' },
  ];

  return (
    <div className="flex space-x-6 border-b border-white/10 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`pb-2 text-sm font-medium transition-colors cursor-pointer ${
            active === tab.id
              ? 'text-neoncyan border-b-2 border-neoncyan text-glow-cyan'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
