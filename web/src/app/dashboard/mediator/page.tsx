'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { ShieldAlert } from 'lucide-react';
import { DashboardTabs } from './DashboardTabs';
import { ActiveDisputesView } from './ActiveDisputesView';
import { HistoryView } from './HistoryView';

export default function MediatorDashboard() {
  const { isConnected, address, isLoading } = useWallet();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('active_disputes');

  // Basic access control
  useEffect(() => {
    if (isLoading) return;
    const mediatorAddress = process.env.NEXT_PUBLIC_MEDIATOR_ADDRESS;
    if (!isConnected || address !== mediatorAddress) {
      router.push('/');
    }
  }, [isLoading, isConnected, address, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-neoncyan border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-heading text-sm">Verifying mediator access...</p>
        </div>
      </div>
    );
  }

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
          Review and resolve active disputes across the platform.
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
