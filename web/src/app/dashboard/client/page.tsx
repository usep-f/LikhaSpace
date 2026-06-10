'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Briefcase } from 'lucide-react';
import { DashboardTabs } from './DashboardTabs';
import { ActiveProjectsView } from './ActiveProjectsView';
import { ProfileSettingsView } from './ProfileSettingsView';
import { HistoryView } from './HistoryView';

export default function ClientDashboard() {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('active_projects');

  return (
    <div className="min-h-screen bg-obsidian text-white py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-left border-b border-white/5 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
          <Briefcase className="w-5 h-5 text-neoncyan text-glow-cyan" />
          <span>Client Dashboard</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {isConnected
            ? 'Track your active bookings, fund escrows, and communicate with freelancers.'
            : 'Dev Sandbox: Showing mockup state. Connect wallet to sync.'}
        </p>
      </div>

      <div className="mt-8">
        <DashboardTabs active={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'active_projects' && <ActiveProjectsView />}
        {activeTab === 'profile' && <ProfileSettingsView />}
        {activeTab === 'history' && <HistoryView />}
      </div>
    </div>
  );
}
