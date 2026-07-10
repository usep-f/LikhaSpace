'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useWallet } from '@/context/WalletContext';
import { Search, ArrowRight } from 'lucide-react';
import { LoginModal } from '@/components/LoginModal';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { FloatingParticles } from '@/components/ui/FloatingParticles';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/* ─── Sub-component: Search bar ─── */

interface HeroSearchProps {
  searchVal: string;
  onChange: (val: string) => void;
  onSearchSubmit: (val: string) => void;
}

const HeroSearch: React.FC<HeroSearchProps> = ({
  searchVal,
  onChange,
  onSearchSubmit,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearchSubmit(searchVal);
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

/* ─── Sub-component: CTA Buttons ─── */

interface HeroCTAsProps {
  isConnected: boolean;
  role: string | null;
  onBrowse: () => void;
  onDashboard: () => void;
  onConnect: () => void;
}

const HeroCTAs: React.FC<HeroCTAsProps> = ({
  isConnected,
  role,
  onBrowse,
  onDashboard,
  onConnect,
}) => (
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
        <span>Get Started / Login</span>
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

/* ─── Spring transition preset ─── */
const SPRING = { type: 'spring' as const, stiffness: 50, damping: 18 };

/* ─── Main Hero Section ─── */

interface HeroSectionProps {
  searchVal: string;
  onSearchChange: (val: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchVal,
  onSearchChange,
}) => {
  const { isConnected, role } = useWallet();
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  /**
   * Using useState here is fine — the state is set from a
   * callback prop (onComplete), not synchronously inside an effect.
   */
  const [phase, setPhase] = useState(0);
  // phase 0 = typing line 1
  // phase 1 = line 1 done, typing line 2
  // phase 2 = all done, show rest

  const handleLine1Done = useCallback(() => setPhase(1), []);
  const handleLine2Done = useCallback(() => setPhase(2), []);

  const handleConnectAction = () => {
    if (!isConnected) setShowLoginModal(true);
  };

  const handleSearchSubmit = (term: string) => {
    onSearchChange(term);
    router.push(`/gigs?search=${encodeURIComponent(term)}`);
  };

  const handleDashboardRedirect = () => {
    if (role === 'artist') router.push('/dashboard/artist');
    else if (role === 'client') router.push('/dashboard/client');
  };

  const showRest = prefersReduced || phase >= 2;

  return (
    <section className="relative min-h-[90vh] lg:min-h-[85vh] flex items-center overflow-hidden border-b border-white/5 py-12 md:py-20 bg-obsidian">
      {/* Background Image & Cyberpunk Gradient Overlays */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/images/cyberpunk_hero_bg_user.jpg"
          alt="Futuristic Cyberpunk Freelancer Workstation"
          fill
          className="object-cover object-right opacity-40 md:opacity-50 lg:opacity-75"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/95 to-transparent lg:via-obsidian/80 lg:to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent z-10" />
      </div>

      {/* Floating particles */}
      <FloatingParticles count={14} className="z-[5]" />

      {/* Hero Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-left z-20">
            {/* Badge */}
            <motion.div
              initial={prefersReduced ? undefined : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex px-3 py-1 rounded-full bg-hotpink/10 border border-hotpink/30 text-[10px] uppercase font-bold tracking-widest text-hotpink font-heading text-glow-pink"
            >
              Stellar-Powered Escrow Protocol
            </motion.div>

            {/* Headline with typewriter */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-none max-w-md sm:max-w-lg">
              <TypewriterText
                text="Trustless Work."
                startDelay={600}
                charSpeed={50}
                onComplete={handleLine1Done}
              />
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-hotpink to-neoncyan text-glow-pink text-shimmer-gradient">
                {phase >= 1 ? (
                  <TypewriterText
                    text="0% Fees to Start."
                    startDelay={200}
                    charSpeed={40}
                    onComplete={handleLine2Done}
                  />
                ) : (
                  <span className="invisible">0% Fees to Start.</span>
                )}
              </span>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={prefersReduced ? undefined : { opacity: 0, y: 16 }}
              animate={showRest ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING, delay: 0.1 }}
              className="text-base sm:text-lg text-gray-400 max-w-md sm:max-w-lg leading-relaxed"
            >
              LikhaSpace is the premier Filipino freelance engine bridging
              creative minds with global clients. Fund secure smart escrows,
              protect deliverables, and earn ratings on-chain.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={prefersReduced ? undefined : { opacity: 0, y: 16 }}
              animate={showRest ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING, delay: 0.25 }}
            >
              <HeroSearch
                searchVal={searchVal}
                onChange={onSearchChange}
                onSearchSubmit={handleSearchSubmit}
              />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={prefersReduced ? undefined : { opacity: 0, y: 16 }}
              animate={showRest ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING, delay: 0.4 }}
            >
              <HeroCTAs
                isConnected={isConnected}
                role={role}
                onBrowse={() => router.push('/gigs')}
                onDashboard={handleDashboardRedirect}
                onConnect={handleConnectAction}
              />
            </motion.div>
          </div>

          <div className="hidden lg:col-span-6 lg:block" />
        </div>
      </div>
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </section>
  );
};
