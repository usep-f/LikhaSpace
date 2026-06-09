import React from 'react';
import { Search } from 'lucide-react';

interface DashboardSearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  filterValue?: string;
  onFilterChange?: (val: string) => void;
  filterOptions?: { label: string; value: string }[];
}

export const DashboardSearch: React.FC<DashboardSearchProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  filterValue,
  onFilterChange,
  filterOptions
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-obsidian border border-white/10 hover:border-white/20 focus:border-neoncyan focus:ring-1 focus:ring-neoncyan text-white text-xs rounded-lg transition-all"
        />
      </div>

      {filterOptions && onFilterChange && (
        <select
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-4 py-2.5 bg-obsidian border border-white/10 rounded-lg text-xs text-white focus:border-neoncyan focus:ring-1 focus:ring-neoncyan appearance-none cursor-pointer sm:w-48"
        >
          {filterOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  );
};
