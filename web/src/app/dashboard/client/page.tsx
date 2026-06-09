'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Briefcase } from 'lucide-react';

const UpfrontSlider: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <div className="space-y-1">
    <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Upfront Payout</label>
    <div className="flex items-center space-x-3">
      <input
        type="range"
        min="0"
        max="50"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-hotpink"
      />
      <span className="text-xs text-white font-mono">{value}%</span>
    </div>
  </div>
);

const GigPostFields: React.FC<{ upfront: number; onUpfrontChange: (v: number) => void }> = ({ upfront, onUpfrontChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="space-y-1">
      <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Project Name</label>
      <input type="text" placeholder="e.g. Figma UI Mockups" className="w-full p-2 bg-obsidian border border-white/10 rounded-lg text-xs" />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Talent Wallet Address</label>
      <input type="text" placeholder="G..." className="w-full p-2 bg-obsidian border border-white/10 rounded-lg text-xs" />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Budget (USD)</label>
      <input type="number" placeholder="500" className="w-full p-2 bg-obsidian border border-white/10 rounded-lg text-xs" />
    </div>
    <UpfrontSlider value={upfront} onChange={onUpfrontChange} />
  </div>
);

const ManageGigsTable: React.FC = () => (
  <div className="p-6 rounded-xl glass-card border border-white/5">
    <h3 className="font-heading font-bold text-sm text-white mb-4">Your Escrowed Gigs</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-gray-400">
        <thead>
          <tr className="border-b border-white/5 text-gray-300 font-bold uppercase tracking-wider text-[10px]">
            <th className="pb-3">Project Name</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Upfront</th>
            <th className="pb-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-white/5">
            <td className="py-4 text-white font-semibold">Figma Portfolio Mockups</td>
            <td className="py-4"><span className="text-neongreen font-bold">Work Submitted</span></td>
            <td className="py-4">20% Paid</td>
            <td className="py-4 text-right space-x-2">
              <button className="px-2.5 py-1.5 rounded bg-neongreen text-obsidian font-heading text-[10px] font-bold transition-all cursor-pointer">
                Release Escrow
              </button>
              <button className="px-2.5 py-1.5 rounded bg-hotpink/10 border border-hotpink/30 text-hotpink font-heading text-[10px] font-bold hover:bg-hotpink/20 transition-all cursor-pointer">
                File Dispute
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default function ClientDashboard() {
  const { isConnected } = useWallet();
  const [upfront, setUpfront] = useState<number>(20);

  return (
    <div className="min-h-screen bg-obsidian text-white py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-left border-b border-white/5 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
          <Briefcase className="w-5 h-5 text-neoncyan text-glow-cyan" />
          <span>Client console Panel</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {isConnected
            ? 'Post gigs, fund escrows using Soroban contracts, and release balances to freelancers.'
            : 'Dev Sandbox: Showing mockup state. Connect wallet to sync.'}
        </p>
      </div>

      <div className="p-6 rounded-xl glass-card border border-white/5 space-y-4">
        <h3 className="font-heading font-bold text-sm text-white border-b border-white/5 pb-2">Initialize New Project</h3>
        <GigPostFields upfront={upfront} onUpfrontChange={setUpfront} />
        <button className="w-full py-2.5 rounded bg-neongreen text-obsidian font-heading font-bold text-xs uppercase tracking-wider border border-neongreen/45 hover:shadow-[0_0_10px_rgba(57,255,20,0.3)] transition-all cursor-pointer">
          Fund & Initialize Escrow
        </button>
      </div>

      <ManageGigsTable />
    </div>
  );
}
