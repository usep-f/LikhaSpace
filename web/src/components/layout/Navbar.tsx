'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { Wallet, LogOut, LayoutDashboard, Globe } from 'lucide-react';
import Link from 'next/link';

// Sub-component: Brand Logo
const BrandLogo: React.FC = () => (
  <Link href="/" className="flex items-center space-x-2 cursor-pointer">
    <div className="w-8 h-8 rounded-lg neon-border-pink flex items-center justify-center bg-violet-dark/80">
      <span className="text-hotpink font-heading font-bold text-lg text-glow-pink">L</span>
    </div>
    <span className="font-heading text-xl font-bold tracking-wider text-glow-pink text-hotpink">
      LikhaSpace
    </span>
  </Link>
);

// Sub-component: Testnet Status Badge
const TestnetBadge: React.FC = () => (
  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-neongreen/10 border border-neongreen/30">
    <span className="w-2 h-2 rounded-full bg-neongreen animate-pulse text-glow-green" />
    <span className="text-[10px] uppercase font-bold tracking-widest text-neongreen font-heading">
      TESTNET
    </span>
  </div>
);

// Sub-component: Wallet Connect Button
interface WalletButtonProps {
  onConnect: () => void;
  isLoading: boolean;
}

const ConnectButtons: React.FC<WalletButtonProps> = ({ onConnect, isLoading }) => (
  <div className="flex items-center space-x-2">
    <button
      onClick={onConnect}
      disabled={isLoading}
      className="btn-primary flex items-center space-x-2 bg-hotpink text-white hover:bg-hotpink/85 border border-hotpink/50 hover:shadow-[0_0_12px_rgba(255,0,127,0.4)] px-3 py-1.5 rounded-lg font-heading text-xs font-semibold cursor-pointer transition-all duration-200"
    >
      <Wallet className="w-3.5 h-3.5" />
      <span>{isLoading ? 'Connecting...' : 'Freighter'}</span>
    </button>
  </div>
);

// Sub-component: Connected User Profile Box
interface ProfileBoxProps {
  address: string;
  name?: string;
  role: string | null;
  onDisconnect: () => void;
}

const ProfileBox: React.FC<ProfileBoxProps> = ({ address, name, role, onDisconnect }) => {
  const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
  const displayName = name || shortAddress;
  return (
    <div className="flex items-center space-x-3 bg-violet-dark/50 border border-white/10 px-2.5 py-1 rounded-lg">
      <div className="text-right">
        <p className="text-xs font-bold text-gray-300 font-heading leading-tight">{displayName}</p>
        <p className="text-[9px] text-neoncyan uppercase font-bold tracking-wider leading-none">
          {role === 'artist' ? 'Freelancer' : (role || 'Select Role')}
        </p>
      </div>
      <button
        onClick={onDisconnect}
        title="Disconnect Wallet"
        className="text-gray-400 hover:text-hotpink hover:text-glow-pink cursor-pointer transition-all duration-200 p-1 hover:bg-white/5 rounded"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { address, role, isConnected, isLoading, connectWallet, disconnectWallet, userProfile } = useWallet();

  const dashboardUrl = role === 'artist' 
    ? '/dashboard/artist' 
    : role === 'client' 
      ? '/dashboard/client' 
      : '#';

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-white/5 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <BrandLogo />
            <TestnetBadge />
            
            {/* Primary Nav Links */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/gigs" className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors duration-150">
                <Globe className="w-3.5 h-3.5 text-neoncyan" />
                <span>Marketplace</span>
              </Link>
              {isConnected && role && (
                <Link href={dashboardUrl} className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors duration-150">
                  <LayoutDashboard className="w-3.5 h-3.5 text-hotpink" />
                  <span>Dashboard</span>
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Sandbox Quick Access Links */}
            <div className="flex items-center space-x-2 border-r border-white/15 pr-4 mr-2 text-[10px] uppercase font-bold tracking-wider font-heading text-gray-400">
              <span className="text-[9px] text-gray-500">Dev Sandbox:</span>
              <Link href="/dashboard/client" className="hover:text-neoncyan transition-colors">Client</Link>
              <span>•</span>
              <Link href="/dashboard/artist" className="hover:text-hotpink transition-colors">Freelancer</Link>
              <span>•</span>
              <Link href="/dashboard/mediator" className="hover:text-neongreen transition-colors">Mediator</Link>
            </div>

            {isConnected && address ? (
              <ProfileBox address={address} name={userProfile?.name} role={role} onDisconnect={disconnectWallet} />
            ) : (
              <ConnectButtons onConnect={connectWallet} isLoading={isLoading} />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
