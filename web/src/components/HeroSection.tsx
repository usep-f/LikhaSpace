'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { Search, ArrowRight, ShieldCheck, Coins, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Sub-component: Escrow Flow Chart Diagram (Right side)
const EscrowFlowMockup: React.FC = () => (
  <div className="relative w-full glass-card border border-white/10 rounded-2xl p-6 shadow-[0_0_30px_rgba(124,58,237,0.15)] flex flex-col justify-between space-y-6 overflow-hidden min-h-[350px]">
    <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-hotpink/10 blur-3xl pointer-events-none" />
    <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-neoncyan/10 blur-3xl pointer-events-none" />

    <div className="flex items-center justify-between border-b border-white/5 pb-4">
      <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-hotpink text-glow-pink">
        Escrow Ledger Protocol
      </h3>
      <span className="text-[10px] text-neongreen font-mono bg-neongreen/10 px-2 py-0.5 rounded-full border border-neongreen/20">
        Active Contract
      </span>
    </div>

    <div className="flex flex-col space-y-4 relative z-10">
      <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-lg border border-white/5">
        <div className="w-8 h-8 rounded-full bg-neoncyan/10 border border-neoncyan/40 flex items-center justify-center">
          <Coins className="w-4 h-4 text-neoncyan" />
        </div>
        <div className="text-left">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Step 1: Client Fund</p>
          <p className="text-xs text-white">USD Budget conversion locked in XLM Escrow</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-lg border border-white/5">
        <div className="w-8 h-8 rounded-full bg-hotpink/10 border border-hotpink/40 flex items-center justify-center">
          <Send className="w-4 h-4 text-hotpink" />
        </div>
        <div className="text-left">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Step 2: Upfront Release</p>
          <p className="text-xs text-white">Upfront payment (0% - 50%) dispatched instantly</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-lg border border-white/5">
        <div className="w-8 h-8 rounded-full bg-neongreen/10 border border-neongreen/40 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-neongreen" />
        </div>
        <div className="text-left">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Step 3: Verification</p>
          <p className="text-xs text-white">Work link review → balance released to Artist</p>
        </div>
      </div>
    </div>
  </div>
);

// Sub-component: Search bar in Hero
interface HeroSearchProps {
  searchVal: string;
  onChange: (val: string) => void;
  onSearchSubmit: (val: string) => void;
}

const HeroSearch: React.FC<HeroSearchProps> = ({ searchVal, onChange, onSearchSubmit }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchVal);
    }
  };

  return (
    <div className="mt-8 space-y-3 max-w-lg">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search freelance projects (e.g. Rust, Synthwave, Figma) and press Enter..."
          className="w-full pl-12 pr-4 py-3 bg-violet-dark/45 border border-white/10 hover:border-white/20 focus:border-neoncyan focus:ring-1 focus:ring-neoncyan text-white text-sm rounded-xl transition-all duration-300"
        />
      </div>
      <div className="flex flex-wrap gap-2 items-center text-xs text-gray-400">
        <span className="font-heading font-semibold text-glow-cyan text-neoncyan uppercase tracking-wider text-[10px]">
          Popular:
        </span>
        {['Synthwave', 'Figma', 'Soroban', 'SEO Copy'].map((tag) => (
          <button
            key={tag}
            onClick={() => onSearchSubmit(tag)}
            className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/5 hover:border-white/20 text-gray-300 hover:text-white cursor-pointer transition-all duration-150"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

// Sub-component: Hero CTA Buttons
interface HeroCTAsProps {
  isConnected: boolean;
  role: string | null;
  onBrowse: () => void;
  onDashboard: () => void;
  onConnect: () => void;
}

const HeroCTAs: React.FC<HeroCTAsProps> = ({ isConnected, role, onBrowse, onDashboard, onConnect }) => (
  <div className="flex flex-wrap gap-4 mt-8">
    {isConnected && role ? (
      <button
        onClick={onDashboard}
        className="btn-primary bg-neongreen hover:bg-neongreen/85 text-obsidian border border-neongreen/45 hover:shadow-[0_0_14px_rgba(57,255,20,0.4)] flex items-center space-x-2 px-6 py-3 rounded-lg font-heading text-sm font-bold cursor-pointer transition-all duration-200"
      >
        <span>Go to Dashboard</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    ) : (
      <button
        onClick={onConnect}
        className="btn-primary bg-hotpink hover:bg-hotpink/85 text-white border border-hotpink/45 hover:shadow-[0_0_14px_rgba(255,0,127,0.4)] flex items-center space-x-2 px-6 py-3 rounded-lg font-heading text-sm font-bold cursor-pointer transition-all duration-200"
      >
        <span>Get Started / Connect Wallet</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    )}
    
    <button
      onClick={onBrowse}
      className="btn-secondary border-2 border-neoncyan/70 hover:border-neoncyan text-neoncyan hover:text-white hover:shadow-[0_0_12px_rgba(0,243,255,0.25)] flex items-center space-x-2 px-6 py-3 rounded-lg font-heading text-sm font-semibold cursor-pointer transition-all duration-200"
    >
      <span>Browse Gigs Feed</span>
    </button>
  </div>
);

interface HeroSectionProps {
  searchVal: string;
  onSearchChange: (val: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ searchVal, onSearchChange }) => {
  const { isConnected, role, connectWallet, simulateWallet } = useWallet();
  const router = useRouter();

  const handleConnectAction = () => {
    if (!isConnected) {
      connectWallet().catch(() => simulateWallet());
    }
  };

  const handleSearchSubmit = (term: string) => {
    onSearchChange(term);
    router.push(`/gigs?search=${encodeURIComponent(term)}`);
  };

  const handleDashboardRedirect = () => {
    if (role === 'artist') {
      router.push('/dashboard/artist');
    } else if (role === 'client') {
      router.push('/dashboard/client');
    }
  };

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-white/5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex px-3 py-1 rounded-full bg-hotpink/10 border border-hotpink/30 text-[10px] uppercase font-bold tracking-widest text-hotpink font-heading text-glow-pink">
            Stellar-Powered Escrow Protocol
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-none">
            Trustless Work.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-hotpink to-neoncyan text-glow-pink">
              Zero Extraction Fees.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed">
            LikhaSpace is the premier Filipino freelance engine bridging creative minds with global clients. Fund secure smart escrows, protect deliverables, and earn ratings on-chain.
          </p>

          <HeroSearch
            searchVal={searchVal}
            onChange={onSearchChange}
            onSearchSubmit={handleSearchSubmit}
          />

          <HeroCTAs
            isConnected={isConnected}
            role={role}
            onBrowse={() => router.push('/gigs')}
            onDashboard={handleDashboardRedirect}
            onConnect={handleConnectAction}
          />
        </div>

        <div className="lg:col-span-5 w-full flex justify-center">
          <div className="w-full max-w-md">
            <EscrowFlowMockup />
          </div>
        </div>
      </div>
    </section>
  );
};
