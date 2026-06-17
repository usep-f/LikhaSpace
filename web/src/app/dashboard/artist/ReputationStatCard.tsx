import React from 'react';

export interface ReputationStatCardProps {
  label: string;
  value: string;
  colorClass: string;
}

export const ReputationStatCard: React.FC<ReputationStatCardProps> = ({ label, value, colorClass }) => {
  return (
    <div className="p-4 rounded-xl glass-card border border-white/5">
      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">{label}</p>
      <p className={`text-xl font-bold font-heading mt-1 ${colorClass}`}>{value}</p>
    </div>
  );
};
