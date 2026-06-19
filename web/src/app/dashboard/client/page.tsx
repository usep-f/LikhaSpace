'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { FreelancerProfile } from '@/lib/types';
import { Briefcase } from 'lucide-react';
import { DashboardTabs } from './DashboardTabs';
import { ActiveProjectsView } from './ActiveProjectsView';
import { OverviewView } from './OverviewView';
import { ProfileSettingsView } from './ProfileSettingsView';
import { HistoryView } from './HistoryView';

export default function ClientDashboard() {
  const { isConnected, address, isLoading, role, isRegistered, userProfile } = useWallet();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isLoading) return;
    
    if (!isConnected || !address || !isRegistered) {
      router.push('/');
      return;
    }

    if (role !== 'client') {
      if (role === 'artist') {
        router.push('/dashboard/artist');
      } else if (role === 'mediator') {
        router.push('/dashboard/mediator');
      } else {
        router.push('/');
      }
    }
  }, [isLoading, isConnected, address, role, isRegistered, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-neoncyan border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-heading text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-white py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-left border-b border-white/5 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
          <Briefcase className="w-5 h-5 text-neoncyan text-glow-cyan" />
          <span>Client Dashboard</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Track your active bookings, fund escrows, and communicate with freelancers.
        </p>
      </div>

      <div className="mt-8">
        <DashboardTabs active={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'overview' && <OverviewView profile={userProfile as FreelancerProfile | null} />}
        {activeTab === 'active_projects' && <ActiveProjectsView />}
        {activeTab === 'profile' && <ProfileSettingsView />}
        {activeTab === 'history' && <HistoryView />}
      </div>
    </div>
  );
}
