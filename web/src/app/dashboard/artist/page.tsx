'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { Sparkles, Wallet } from 'lucide-react';
import { getUserProfile } from '@/lib/db';
import { getFreelancerReputation, ReputationData } from '@/lib/contract';
import { FreelancerProfile } from '@/lib/types';
import { DashboardTabs } from './DashboardTabs';
import { ListingsView } from './ListingsView';
import { OrdersView } from './OrdersView';
import { HistoryView } from './HistoryView';
import { OverviewView } from './OverviewView';

export default function ArtistDashboard() {
  const { isConnected, uid, address, isLoading, role, isRegistered, linkWallet } = useWallet();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [onChainReputation, setOnChainReputation] = useState<ReputationData | null>(null);

  useEffect(() => {
    if (!uid) return;
    getUserProfile(uid)
      .then((p) => {
        if (p) {
          setProfile({
            address: address || '',
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

    if (address) {
      getFreelancerReputation(address)
        .then((rep) => {
          setOnChainReputation(rep);
        })
        .catch(console.error);
    } else {
      Promise.resolve().then(() => setOnChainReputation(null));
    }
  }, [uid, address]);

  useEffect(() => {
    if (isLoading) return;
    
    if (!isConnected || !uid || !isRegistered) {
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
  }, [isLoading, isConnected, uid, role, isRegistered, router]);

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

      {!address ? (
        <div className="mt-12 bg-violet-dark/50 border border-hotpink/20 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-xl animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-hotpink/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-hotpink/20">
            <Wallet className="w-8 h-8 text-hotpink" />
          </div>
          <h3 className="text-lg font-bold font-heading text-white">Stellar Wallet Connection Required</h3>
          <p className="text-xs text-gray-400 mt-2 mb-6 leading-relaxed">
            To activate your freelancer dashboard, publish gigs, and receive escrow payments, you must link your Stellar wallet.
          </p>
          <button
            onClick={async () => {
              try {
                await linkWallet();
              } catch {
                // Link wallet error handled in context
              }
            }}
            className="px-6 py-3 bg-hotpink text-white font-bold font-heading text-xs uppercase tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(255,0,127,0.4)] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Link Freighter Wallet
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <DashboardTabs active={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'overview' && <OverviewView profile={profile} totalEarned={totalEarned} completed={completed} />}
          {activeTab === 'listings' && <ListingsView />}
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'history' && <HistoryView />}
        </div>
      )}
    </div>
  );
}
