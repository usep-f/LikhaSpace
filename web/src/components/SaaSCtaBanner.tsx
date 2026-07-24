'use client';

import React, { useState } from 'react';
import { ArrowRight, Rocket } from 'lucide-react';
import { LoginModal } from '@/components/LoginModal';
import { useWallet } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { FloatingParticles } from '@/components/ui/FloatingParticles';

export interface SaaSCtaBannerProps {
  className?: string;
}

export const SaaSCtaBanner: React.FC<SaaSCtaBannerProps> = () => {
  const { isConnected, role } = useWallet();
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const router = useRouter();

  const handleCtaClick = () => {
    if (!isConnected) {
      setShowLoginModal(true);
    } else if (role === 'artist') {
      router.push('/dashboard/artist');
    } else if (role === 'client') {
      router.push('/dashboard/client');
    } else {
      router.push('/gigs');
    }
  };

  return (
    <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <AnimatedSection viewportAmount={0.25}>
        <div className="relative rounded-3xl overflow-hidden glass-card border border-white/10 p-8 md:p-12 text-center shadow-[0_0_50px_rgba(255,0,127,0.08)]">
          {/* Glow accents */}
          <div className="absolute -left-32 -top-32 w-64 h-64 rounded-full bg-hotpink/10 blur-3xl pointer-events-none" />
          <div className="absolute -right-32 -bottom-32 w-64 h-64 rounded-full bg-neoncyan/10 blur-3xl pointer-events-none" />

          {/* Floating particles inside the CTA card */}
          <FloatingParticles count={10} />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-hotpink/15 flex items-center justify-center border border-hotpink/30 mb-2">
              <Rocket className="w-6 h-6 text-hotpink" />
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Build on <span className="text-transparent bg-clip-text bg-gradient-to-r from-hotpink to-neoncyan text-glow-pink text-shimmer-gradient">LikhaSpace</span>?
            </h2>
            
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
              Connect your Freighter wallet, define your milestones, and start securing trustless freelance contracts on-chain today.
            </p>

            <button
              onClick={handleCtaClick}
              className="mt-4 bg-hotpink hover:bg-hotpink/85 text-white border border-hotpink/45 hover:shadow-[0_0_20px_rgba(255,0,127,0.4)] flex items-center gap-2 px-8 py-3.5 rounded-xl font-heading text-sm font-bold cursor-pointer transition-all duration-300 transform active:scale-95"
            >
              <span>
                {!isConnected
                  ? 'Login & Onboard'
                  : role
                  ? 'Launch Dashboard'
                  : 'Browse Active Gigs'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </AnimatedSection>
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </section>
  );
};
