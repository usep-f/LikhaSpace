'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { Sparkles } from 'lucide-react';
import { getUserProfile } from '@/lib/db';
import { getFreelancerReputation, ReputationData } from '@/lib/contract';
import { FreelancerProfile } from '@/lib/types';
import { ReputationStatCard } from './ReputationStatCard';
import { DashboardTabs } from './DashboardTabs';
import { ListingsView } from './ListingsView';
import { OrdersView } from './OrdersView';
import { ProfileSettingsView } from './ProfileSettingsView';
import { HistoryView } from './HistoryView';

export default function ArtistDashboard() {
  const { isConnected, address, isLoading, role, isRegistered } = useWallet();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('listings');
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [onChainReputation, setOnChainReputation] = useState<ReputationData | null>(null);

  useEffect(() => {
    if (!address) return;
    getUserProfile(address)
      .then((p) => {
        if (p) {
          setProfile({
            address,
            name: p.name || 'Anonymous',
            title: p.title || '',
            bio: p.bio || '',
            totalEarnedXLM: p.totalEarnedXLM || 0,
            projectsCompleted: p.projectsCompleted || 0,
            averageRating: p.averageRating || 5.0,
            testimonials: p.testimonials || [],
          });
        } else {
          setProfile(null);
        }
      })
      .catch(console.error);

    getFreelancerReputation(address)
      .then((rep) => {
        setOnChainReputation(rep);
      })
      .catch(console.error);
  }, [address]);

  useEffect(() => {
    if (isLoading) return;
    
    if (!isConnected || !address || !isRegistered) {
      router.push('/');
      return;
    }

    if (role !== 'artist') {
      if (role === 'client') {
        router.push('/dashboard/client');
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
          <div className="w-12 h-12 border-4 border-hotpink border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-heading text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Calculate dynamic stats
  const completed = onChainReputation ? onChainReputation.projectsCompleted : (profile?.projectsCompleted || 0);
  const totalEarned = onChainReputation ? Number(onChainReputation.totalEarnedStroops) / 10000000 : (profile?.totalEarnedXLM || 0);

  // Check if there are any reviews in either database or on-chain
  const hasOnChainReviews = onChainReputation && onChainReputation.ratingCount > 0;
  const hasDbReviews = profile && profile.testimonials && profile.testimonials.length > 0;
  
  const ratingValue = hasOnChainReviews
    ? onChainReputation.ratingSum / onChainReputation.ratingCount
    : (hasDbReviews ? profile.averageRating : null);

  const ratingText = ratingValue !== null ? `${ratingValue.toFixed(1)} Rating` : 'No Reviews';

  return (
    <div className="min-h-screen bg-obsidian text-white py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-left border-b border-white/5 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-hotpink text-glow-pink" />
          <span>Freelancer Dashboard</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage your services, accept requests, and track active escrow contracts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ReputationStatCard label="Total XLM Earned" value={`${totalEarned.toLocaleString()} XLM`} colorClass="text-glow-green text-neongreen" />
        <ReputationStatCard label="Gigs Completed" value={`${completed} Projects`} colorClass="text-glow-pink text-hotpink" />
        <ReputationStatCard label="On-Chain Reputation" value={ratingText} colorClass="text-glow-cyan text-neoncyan" />
      </div>

      <div className="mt-8">
        <DashboardTabs active={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'listings' && <ListingsView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'profile' && <ProfileSettingsView />}
        {activeTab === 'history' && <HistoryView />}
      </div>
    </div>
  );
}
