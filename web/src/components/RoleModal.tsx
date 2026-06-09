'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { Palette, Briefcase, Sparkles } from 'lucide-react';

interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentClass: string;
  onClick: () => void;
}

const RoleCard: React.FC<CardProps> = ({ title, description, icon, accentClass, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-6 rounded-xl glass-card border border-white/10 hover:scale-[1.02] active:scale-[0.98] ${accentClass} cursor-pointer transition-all duration-300`}
  >
    <div className="flex items-center space-x-4">
      <div className="p-3 rounded-lg bg-white/5">
        {icon}
      </div>
      <div>
        <h3 className="font-heading font-bold text-lg text-white">{title}</h3>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  </button>
);

export const RoleModal: React.FC = () => {
  const { isConnected, role, selectRole } = useWallet();

  // Only display modal if wallet is connected but role is not chosen yet
  if (!isConnected || role) {
    return null;
  }

  const handleArtistSelect = () => selectRole('artist');
  const handleClientSelect = () => selectRole('client');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-md">
      <div className="w-full max-w-lg p-8 rounded-2xl bg-violet-dark/90 border border-hotpink/30 hover:border-hotpink/70 shadow-[0_0_20px_rgba(255,0,127,0.3)] animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="inline-flex p-2 rounded-full bg-hotpink/10 border border-hotpink/20 mb-3">
            <Sparkles className="w-6 h-6 text-hotpink text-glow-pink animate-pulse" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-white">Select Your Role</h2>
          <p className="text-sm text-gray-400 mt-1">
            Choose how you want to interact with the LikhaSpace platform.
          </p>
        </div>

        <div className="space-y-4">
          <RoleCard
            title="Creative Artist"
            description="Showcase your music, designs, or writing, build on-chain reputation, and receive secure zero-fee escrow payments."
            icon={<Palette className="w-6 h-6 text-hotpink" />}
            accentClass="hover:border-hotpink/50 hover:shadow-[0_0_12px_rgba(255,0,127,0.3)]"
            onClick={handleArtistSelect}
          />
          
          <RoleCard
            title="Project Client"
            description="Find premium Filipino talent, set budgets in USD, fund secure escrows in XLM, and manage deliverables effortlessly."
            icon={<Briefcase className="w-6 h-6 text-neoncyan" />}
            accentClass="hover:border-neoncyan/50 hover:shadow-[0_0_12px_rgba(0,243,255,0.3)]"
            onClick={handleClientSelect}
          />
        </div>
      </div>
    </div>
  );
};
