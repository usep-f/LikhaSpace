'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { LogOut, LayoutDashboard, Globe, LogIn, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { NotificationBell } from './NotificationBell';
import { LoginModal } from '@/components/LoginModal';

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
      <LogIn className="w-3.5 h-3.5" />
      <span>{isLoading ? 'Logging in...' : 'Login'}</span>
    </button>
  </div>
);

// Sub-component: Connected User Profile Box
interface ProfileBoxProps {
  address: string | null;
  name?: string;
  role: string | null;
  onDisconnect: () => void;
}

const ProfileBox: React.FC<ProfileBoxProps> = ({ address, name, role, onDisconnect }) => {
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
  const displayName = name || shortAddress || 'User';
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
        title="Log Out"
        className="text-gray-400 hover:text-hotpink hover:text-glow-pink cursor-pointer transition-all duration-200 p-1 hover:bg-white/5 rounded"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { uid, address, role, isConnected, isLoading, disconnectWallet, userProfile } = useWallet();
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const dashboardUrl = role === 'artist' 
    ? '/dashboard/artist' 
    : role === 'client' 
      ? '/dashboard/client' 
      : role === 'mediator'
        ? '/dashboard/mediator'
        : '#';

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-white/5 w-full bg-[#0B0813]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <BrandLogo />
            <TestnetBadge />
          </div>
          
          {/* Desktop Navigation Group (Visible on screens >= 1000px) */}
          <div className="hidden min-[1000px]:flex items-center space-x-4">
            {/* Navigation Links */}
            <div className="flex items-center space-x-4 border-r border-white/15 pr-4 mr-1">
              <Link
                href="/gigs"
                className="flex items-center space-x-1 text-xs font-semibold text-gray-400 hover:text-white hover:text-glow-cyan transition-all duration-200 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-neoncyan" />
                <span>Marketplace</span>
              </Link>
              {isConnected && role && (
                <Link
                  href={dashboardUrl}
                  className="flex items-center space-x-1 text-xs font-semibold text-gray-400 hover:text-white hover:text-glow-pink transition-all duration-200 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-hotpink" />
                  <span>Dashboard</span>
                </Link>
              )}
            </div>

            {isConnected && uid ? (
              <>
                <NotificationBell />
                <ProfileBox address={address} name={userProfile?.name} role={role} onDisconnect={disconnectWallet} />
              </>
            ) : (
              <ConnectButtons onConnect={() => setShowLoginModal(true)} isLoading={isLoading} />
            )}
          </div>

          {/* Mobile Navigation Controls (Visible on screens < 1000px) */}
          <div className="flex min-[1000px]:hidden items-center space-x-3">
            {isConnected && uid && (
              <NotificationBell />
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-hotpink/50"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Panel (Visible on screens < 1000px) */}
      {isOpen && (
        <div className="min-[1000px]:hidden border-t border-white/5 bg-[#0B0813]/95 backdrop-blur-xl px-4 py-4 space-y-4 shadow-2xl">
          <div className="flex flex-col space-y-2">
            <Link
              href="/gigs"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-2 text-sm font-semibold text-gray-400 hover:text-white hover:text-glow-cyan transition-all duration-200 py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-neoncyan" />
              <span>Marketplace</span>
            </Link>
            {isConnected && role && (
              <Link
                href={dashboardUrl}
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 text-sm font-semibold text-gray-400 hover:text-white hover:text-glow-pink transition-all duration-200 py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-hotpink" />
                <span>Dashboard</span>
              </Link>
            )}
          </div>
          
          <div className="border-t border-white/5 pt-4">
            {isConnected && uid ? (
              <div className="flex items-center justify-between w-full">
                <ProfileBox address={address} name={userProfile?.name} role={role} onDisconnect={() => {
                  disconnectWallet();
                  setIsOpen(false);
                }} />
              </div>
            ) : (
              <div className="w-full" onClick={() => {
                setShowLoginModal(true);
                setIsOpen(false);
              }}>
                <ConnectButtons onConnect={() => setShowLoginModal(true)} isLoading={isLoading} />
              </div>
            )}
          </div>
        </div>
      )}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </nav>
  );
};
