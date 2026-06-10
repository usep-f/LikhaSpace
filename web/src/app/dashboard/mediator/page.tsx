'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { ShieldAlert } from 'lucide-react';

const DisputedCaseInfo: React.FC = () => (
  <div className="space-y-3">
    <p className="text-xs text-gray-300 font-bold">Disputed Case: Game Score Project</p>
    <div className="bg-white/5 p-3 rounded-lg text-xs space-y-1 text-gray-400">
      <p><strong>Freelancer:</strong> GCBC...DEMO...KEY</p>
      <p><strong>Client:</strong> GBC2...9A4F</p>
      <p><strong>Escrow Lock:</strong> 250 USD ≈ 2,272 XLM</p>
    </div>
  </div>
);

interface SplitConfigProps {
  split: number;
  onSplitChange: (v: number) => void;
}

const SplitSlider: React.FC<SplitConfigProps> = ({ split, onSplitChange }) => (
  <div className="space-y-4">
    <p className="text-xs text-gray-300 font-bold">Proposed Settlement Split</p>
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-mono text-white">
        <span>Freelancer: {split}%</span>
        <span>Client: {100 - split}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={split}
        onChange={(e) => onSplitChange(Number(e.target.value))}
        className="w-full accent-neoncyan"
      />
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>Mediator Fee (2.5%): 6.25 USD</span>
        <span>Net to Split: 243.75 USD</span>
      </div>
    </div>
    <button className="w-full py-2 rounded bg-neoncyan text-obsidian font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
      Execute Resolution
    </button>
  </div>
);

export default function MediatorDashboard() {
  const { isConnected } = useWallet();
  const [split, setSplit] = useState<number>(50);

  return (
    <div className="min-h-screen bg-obsidian text-white py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-left border-b border-white/5 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-hotpink text-glow-pink" />
          <span>Mediator Arbitration console</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {isConnected
            ? 'Review disputed projects, configure settlement splits, and resolve contracts.'
            : 'Dev Sandbox: Showing mockup state. Connect wallet to sync.'}
        </p>
      </div>

      <div className="p-6 rounded-xl glass-card border border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <DisputedCaseInfo />
          <SplitSlider split={split} onSplitChange={setSplit} />
        </div>
      </div>
    </div>
  );
}
