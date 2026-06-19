'use client';

import React from 'react';
import { Briefcase, Paintbrush, ShieldCheck, CheckCircle2, Wallet, Coins, MessageSquare } from 'lucide-react';
import { AnimatedSection, AnimatedItem } from '@/components/ui/AnimatedSection';

export interface SaaSUseCasesProps {
  className?: string;
}

export const SaaSUseCases: React.FC<SaaSUseCasesProps> = ({ className = '' }) => {
  return (
    <section className={`py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-white/5 ${className}`}>
      <AnimatedSection className="text-center mb-12">
        <h2 className="font-heading text-3xl font-bold text-white tracking-tight">
          Who Is <span className="text-neoncyan text-glow-cyan text-shimmer-gradient text-transparent bg-clip-text bg-gradient-to-r from-neoncyan to-neongreen">LikhaSpace</span> For?
        </h2>
        <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
          Tailored Web3 workflows for creators seeking fair payouts and businesses hiring with zero trust risk.
        </p>
      </AnimatedSection>

      <AnimatedSection stagger className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1: For Freelancers / Artists */}
        <AnimatedItem>
          <div className="p-8 rounded-2xl glass-card border border-white/5 hover:border-hotpink/30 hover:shadow-[0_0_30px_rgba(255,0,127,0.1)] cursor-pointer transition-all duration-300 h-full">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-hotpink/10 border border-hotpink/30 flex items-center justify-center">
                  <Paintbrush className="w-6 h-6 text-hotpink" />
                </div>
                <div className="text-left">
                  <h3 className="font-heading font-bold text-xl text-white">For Freelancers & Artists</h3>
                  <p className="text-xs text-hotpink font-medium tracking-wide uppercase mt-0.5">Secure Your Creative Value</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed text-left">
                Keep every cent you earn. Safeguard your hours against non-payment or arbitrary project cancellations using automated escrow contracts.
              </p>

              <ul className="space-y-3 pt-2">
                <li className="flex items-start space-x-3 text-xs text-gray-300 text-left">
                  <Coins className="w-4 h-4 text-hotpink shrink-0 mt-0.5" />
                  <span><strong className="font-semibold text-white">0% Platform Extraction Fees</strong>: Take home 100% of your payout minus fraction-of-a-cent network gas.</span>
                </li>
                <li className="flex items-start space-x-3 text-xs text-gray-300 text-left">
                  <ShieldCheck className="w-4 h-4 text-hotpink shrink-0 mt-0.5" />
                  <span><strong className="font-semibold text-white">75% Kill-Fee Protection</strong>: Automatically collect partial milestone payouts if a client unilaterally terminates a project mid-milestone.</span>
                </li>
                <li className="flex items-start space-x-3 text-xs text-gray-300 text-left">
                  <Wallet className="w-4 h-4 text-hotpink shrink-0 mt-0.5" />
                  <span><strong className="font-semibold text-white">Instant Wallet Settlements</strong>: Once accepted, your payment is pushed immediately to your self-custodial wallet in 5 seconds.</span>
                </li>
              </ul>
            </div>
          </div>
        </AnimatedItem>

        {/* Card 2: For Clients / Businesses */}
        <AnimatedItem>
          <div className="p-8 rounded-2xl glass-card border border-white/5 hover:border-neoncyan/30 hover:shadow-[0_0_30px_rgba(0,243,255,0.1)] cursor-pointer transition-all duration-300 h-full">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-neoncyan/10 border border-neoncyan/30 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-neoncyan" />
                </div>
                <div className="text-left">
                  <h3 className="font-heading font-bold text-xl text-white">For Clients & Businesses</h3>
                  <p className="text-xs text-neoncyan font-medium tracking-wide uppercase mt-0.5">Streamline Quality Deliveries</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed text-left">
                Source global creative talent without escrow agent fees. Keep full, programmatic control over budgets until deliverables match your criteria.
              </p>

              <ul className="space-y-3 pt-2">
                <li className="flex items-start space-x-3 text-xs text-gray-300 text-left">
                  <CheckCircle2 className="w-4 h-4 text-neoncyan shrink-0 mt-0.5" />
                  <span><strong className="font-semibold text-white">Milestone-Based Escrow</strong>: Fund programmatically and only release payments when deliverables meet requirements.</span>
                </li>
                <li className="flex items-start space-x-3 text-xs text-gray-300 text-left">
                  <MessageSquare className="w-4 h-4 text-neoncyan shrink-0 mt-0.5" />
                  <span><strong className="font-semibold text-white">Built-in Mediation</strong>: Access structured dispute and split-payment proposals directly within the interface if deliverables diverge from spec.</span>
                </li>
                <li className="flex items-start space-x-3 text-xs text-gray-300 text-left">
                  <Coins className="w-4 h-4 text-neoncyan shrink-0 mt-0.5" />
                  <span><strong className="font-semibold text-white">On-Chain Reputation Checks</strong>: Review verified history, active streaks, and client reviews before funding a contract.</span>
                </li>
              </ul>
            </div>
          </div>
        </AnimatedItem>
      </AnimatedSection>
    </section>
  );
};
