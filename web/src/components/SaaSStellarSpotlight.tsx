'use client';

import React from 'react';
import { Cpu, Layers, ShieldCheck, Zap, Network, Activity } from 'lucide-react';

export interface SaaSStellarSpotlightProps {
  className?: string;
}

export const SaaSStellarSpotlight: React.FC<SaaSStellarSpotlightProps> = ({ className = '' }) => {
  return (
    <section className={`py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-white/5 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
        {/* Left Column: Title and Details */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex px-3 py-1 rounded-full bg-neoncyan/10 border border-neoncyan/30 text-[10px] uppercase font-bold tracking-widest text-neoncyan font-heading text-glow-cyan">
            Network Infrastructure
          </div>
          
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none">
            Powered by the <span className="text-transparent bg-clip-text bg-gradient-to-r from-neoncyan to-neongreen text-glow-cyan">Stellar Network</span>
          </h2>
          
          <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
            LikhaSpace leverages the speed, low cost, and security of Stellar to build a completely trustless freelance engine. By running contract interactions on-chain, we remove centralized middlemen and arbitrary payment extraction.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            {/* Benefit 1 */}
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-neoncyan/10 border border-neoncyan/30 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-neoncyan" />
              </div>
              <div>
                <h4 className="font-heading font-semibold text-sm text-white">Soroban Smart Contracts</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Escrows are governed by public, Rust-based WASM smart contracts that secure client deposits and enforce revision agreements programmatically.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-neongreen/10 border border-neongreen/30 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-neongreen" />
              </div>
              <div>
                <h4 className="font-heading font-semibold text-sm text-white">Stellar Asset Contract (SAC)</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Payments are locked using standard token wrappers bridging classic Stellar assets (like native XLM) with next-generation Soroban logic.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-hotpink/10 border border-hotpink/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-hotpink" />
              </div>
              <div>
                <h4 className="font-heading font-semibold text-sm text-white">On-Chain Reputation Registries</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Artist achievements (completed contracts, ratings, and active streaks) are permanently recorded directly on the public ledger.
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-heading font-semibold text-sm text-white">Ultra-Low Gas & Fast Settlement</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Payments settle in seconds under Stellar&apos;s ~5s ledger close time, with network transaction fees costing less than $0.0001 USD.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Ledger State Panel */}
        <div className="lg:col-span-5 w-full flex flex-col items-center lg:h-full">
          <div className="w-full max-w-md glass-card border border-white/10 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,243,255,0.05)] overflow-hidden lg:h-full flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-2">
                <Network className="w-4 h-4 text-neoncyan" />
                <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-white">
                  Stellar Node Status
                </h3>
              </div>
              <span className="flex items-center gap-1.5 text-[9px] text-neongreen font-mono bg-neongreen/10 px-2 py-0.5 rounded-full border border-neongreen/20">
                <Activity className="w-2.5 h-2.5 animate-pulse" />
                Connected
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-between font-mono text-left text-xs text-gray-400 mt-6 min-h-[220px]">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Network Passphrase</span>
                <span className="text-white">Test SDF Network ; Sep 2015</span>
              </div>
              
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Soroban RPC Endpoint</span>
                <span className="text-neoncyan select-all">soroban-testnet.stellar.org</span>
              </div>

              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Average Settlement Time</span>
                <span className="text-white">~5.0 Seconds</span>
              </div>

              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Smart Contract Engine</span>
                <span className="text-white">Soroban Rust SDK v22.0</span>
              </div>

              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Native Gas Token</span>
                <span className="text-white">XLM (Stellar Lumens)</span>
              </div>

              <div className="flex justify-between">
                <span>Standard Base Fee</span>
                <span className="text-neongreen">100 Stroops ($0.000004 USD)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
