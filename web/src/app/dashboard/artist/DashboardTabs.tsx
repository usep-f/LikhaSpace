import React from 'react';

export interface DashboardTabsProps {
  active: string;
  onTabChange: (v: string) => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ active, onTabChange }) => {
  const tabs = ['Overview', 'Listings', 'Orders', 'Profile', 'History'];
  return (
    <div className="flex space-x-6 border-b border-white/5 mb-8">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onTabChange(t.toLowerCase())}
          className={`pb-3 font-heading text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer ${
            active === t.toLowerCase()
              ? 'text-hotpink border-b-2 border-hotpink'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
};
