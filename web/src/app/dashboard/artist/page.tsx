'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { Sparkles } from 'lucide-react';

const ReputationStatCard: React.FC<{ label: string; value: string; colorClass: string }> = ({ label, value, colorClass }) => (
  <div className="p-4 rounded-xl glass-card border border-white/5">
    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">{label}</p>
    <p className={`text-xl font-bold font-heading mt-1 ${colorClass}`}>{value}</p>
  </div>
);

const ArtistStatsGrid: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <ReputationStatCard label="Total XLM Earned" value="4,250 XLM" colorClass="text-glow-green text-neongreen" />
    <ReputationStatCard label="Gigs Completed" value="12 Projects" colorClass="text-glow-pink text-hotpink" />
    <ReputationStatCard label="On-Chain Reputation" value="98% Score" colorClass="text-glow-cyan text-neoncyan" />
  </div>
);

const HiredProjectsTable: React.FC = () => (
  <div className="p-6 rounded-xl glass-card border border-white/5">
    <h3 className="font-heading font-bold text-sm text-white mb-4">Active Engagements</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-gray-400">
        <thead>
          <tr className="border-b border-white/5 text-gray-300 font-bold uppercase tracking-wider text-[10px]">
            <th className="pb-3">Project</th>
            <th className="pb-3">Budget</th>
            <th className="pb-3">Status</th>
            <th className="pb-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-white/5">
            <td className="py-4 text-white font-semibold">Synthwave Soundtrack for Sulo Games</td>
            <td className="py-4">350 USD (3,181 XLM)</td>
            <td className="py-4"><span className="text-neoncyan font-bold">Hired</span></td>
            <td className="py-4 text-right">
              <button className="px-3 py-1.5 rounded bg-hotpink text-white font-heading text-[10px] font-bold border border-hotpink/30 hover:shadow-[0_0_8px_rgba(255,0,127,0.3)] transition-all cursor-pointer">
                Submit Deliverable
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default function ArtistDashboard() {
  const { isConnected } = useWallet();

  return (
    <div className="min-h-screen bg-obsidian text-white py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-left border-b border-white/5 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-hotpink text-glow-pink" />
          <span>Artist Profile Portal</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {isConnected 
            ? 'Manage your projects, submit links, and view your on-chain reputation status.'
            : 'Dev Sandbox: Showing mockup state. Connect wallet to sync.'}
        </p>
      </div>

      <ArtistStatsGrid />
      <HiredProjectsTable />
    </div>
  );
}
