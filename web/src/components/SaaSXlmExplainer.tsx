'use client';

import React from 'react';
import { Coins, Shield, Sparkles, HelpCircle } from 'lucide-react';
import { LivePriceCard } from './ui/LivePriceCard';
import { AnimatedSection, AnimatedItem } from '@/components/ui/AnimatedSection';

export interface SaaSXlmExplainerProps {
  className?: string;
}

export const SaaSXlmExplainer: React.FC<SaaSXlmExplainerProps> = ({ className = '' }) => {
  return (
    <section className={`py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-white/5 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Educational Content */}
        <AnimatedSection className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex px-3 py-1 rounded-full bg-neoncyan/10 border border-neoncyan/30 text-[10px] uppercase font-bold tracking-widest text-neoncyan font-heading text-glow-cyan">
            Network Asset
          </div>
          <h2 className="font-heading text-3xl font-bold text-white tracking-tight leading-none">
            Understanding <span className="text-transparent bg-clip-text bg-gradient-to-r from-neoncyan to-neongreen text-glow-cyan text-shimmer-gradient">XLM (Stellar Lumens)</span>
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
            XLM is the native utility token of the Stellar blockchain. In LikhaSpace, XLM serves as the trustless fuel that makes smart milestone escrows and fast settlements possible.
          </p>

          <AnimatedSection stagger className="space-y-4 pt-2">
            <AnimatedItem>
              <div className="flex items-start space-x-3 p-4 rounded-xl glass-card border border-white/5 hover:border-white/10 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-neoncyan/10 border border-neoncyan/25 flex items-center justify-center shrink-0 mt-0.5">
                  <Coins className="w-4 h-4 text-neoncyan" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-sm text-white">Programmatic Escrow Funding</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Clients fund projects directly in XLM. The funds are securely locked in Soroban smart contracts, completely isolated from platform custody, and only released when milestones are approved.
                  </p>
                </div>
              </div>
            </AnimatedItem>

            <AnimatedItem>
              <div className="flex items-start space-x-3 p-4 rounded-xl glass-card border border-white/5 hover:border-white/10 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-neongreen/10 border border-neongreen/25 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-neongreen" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-sm text-white">Trustless Gas & Flat Platform Fees</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Stellar network transaction fees are virtually zero (less than $0.0001). We charge 0% for your first 20 projects, followed by a market-low flat rate of just 1%.
                  </p>
                </div>
              </div>
            </AnimatedItem>

            <AnimatedItem>
              <div className="flex items-start space-x-3 p-4 rounded-xl glass-card border border-white/5 hover:border-white/10 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-hotpink/10 border border-hotpink/25 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-hotpink" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-sm text-white">Real-time Liquidity & Cashout</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Upon approval, XLM is deposited directly into the artist&apos;s self-custodial wallet. It can be easily swapped for other assets or converted to local currencies like PHP instantly.
                  </p>
                </div>
              </div>
            </AnimatedItem>
          </AnimatedSection>
        </AnimatedSection>

        {/* Right Column: Live Price Card */}
        <AnimatedSection delay={0.2} className="lg:col-span-5 w-full flex justify-center">
          <div className="w-full max-w-md p-6 rounded-2xl glass-card border border-white/10 hover:border-neoncyan/30 shadow-[0_0_30px_rgba(0,243,255,0.08)] hover:shadow-[0_0_30px_rgba(0,243,255,0.15)] hover:scale-[1.01] transition-all duration-300">
            <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-neoncyan" />
              Live XLM Market Value
            </h3>
            <div className="mt-6">
              <LivePriceCard className="bg-[#0B0813] border-white/20 shadow-2xl hover:border-neoncyan/40" />
            </div>
            <p className="text-[10px] text-gray-400 mt-4 leading-relaxed text-left bg-white/5 p-3 rounded-lg border border-white/5">
              💡 <strong className="text-white">Note:</strong> While XLM fluctuates with market demand, LikhaSpace&apos;s smart escrow records the exact USD equivalent funded at the start to protect milestones from market volatility.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};
