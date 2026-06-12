'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { ShieldAlert } from 'lucide-react';
import { DashboardTabs } from './DashboardTabs';
import { ActiveDisputesView } from './ActiveDisputesView';
import { HistoryView } from './HistoryView';

export default function MediatorDashboard() {
  const { isConnected, address, role } = useWallet();
  const [activeTab, setActiveTab] = useState('active_disputes');

  // Basic access control
  useEffect(() => {
    const mediatorAddress = process.env.NEXT_PUBLIC_MEDIATOR_ADDRESS;
    if (isConnected && address !== mediatorAddress) {
      window.location.href = '/';
    }
  }, [isConnected, address]);

  if (address !== process.env.NEXT_PUBLIC_MEDIATOR_ADDRESS) {
    return (
      <div className="min-h-screen bg-obsidian text-white flex items-center justify-center">
        <p>Access Denied. Only the authorized Mediator can view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-white py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-left border-b border-white/5 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-neoncyan text-glow-cyan" />
          <span>Mediator Dashboard</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {isConnected
            ? 'Review and resolve active disputes across the platform.'
            : 'Connect your wallet to manage disputes.'}
        </p>
      </div>

      <div className="mt-8">
        <DashboardTabs active={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'active_disputes' && <ActiveDisputesView />}
        {activeTab === 'history' && <HistoryView />}
      </div>
    </div>
  );
}
