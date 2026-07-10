'use client';

import React from 'react';
import { Percent, Zap, ShieldCheck } from 'lucide-react';
import { AnimatedSection, AnimatedItem } from '@/components/ui/AnimatedSection';
import { FloatingParticles } from '@/components/ui/FloatingParticles';

export interface SaaSPlatformMetricsProps {
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  borderClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, icon, borderClass }) => (
  <div className={`p-6 rounded-2xl glass-card border border-white/5 hover:scale-[1.02] flex flex-col justify-between cursor-pointer transition-all duration-350 ${borderClass}`}>
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-xs uppercase font-heading font-bold text-gray-400 tracking-wider">{title}</h4>
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div>
      <p className="text-4xl sm:text-5xl font-heading font-black text-white mb-2 leading-none">{value}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

export const SaaSPlatformMetrics: React.FC<SaaSPlatformMetricsProps> = () => {
  return (
    <section className="relative py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <FloatingParticles count={8} />
      <AnimatedSection stagger className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <AnimatedItem>
          <MetricCard
            title="Platform Fee"
            value="0%*"
            description="Get 0% fees on your first 20 completed transactions, followed by a flat rate of just 1% thereafter."
            icon={<Percent className="w-5 h-5 text-neoncyan" />}
            borderClass="hover:border-neoncyan/40 hover:shadow-[0_0_20px_rgba(0,243,255,0.15)]"
          />
        </AnimatedItem>

        <AnimatedItem>
          <MetricCard
            title="Settlement Speed"
            value="~5s"
            description="Built on the Stellar network. As soon as the client accepts your work, the payment settles in seconds rather than weeks."
            icon={<Zap className="w-5 h-5 text-neongreen" />}
            borderClass="hover:border-neongreen/40 hover:shadow-[0_0_20px_rgba(57,255,20,0.15)]"
          />
        </AnimatedItem>

        <AnimatedItem>
          <MetricCard
            title="Escrow Security"
            value="100%"
            description="Audited on-chain Soroban escrow contracts protect both clients and creators, securing funds with a 75% client kill-fee."
            icon={<ShieldCheck className="w-5 h-5 text-hotpink" />}
            borderClass="hover:border-hotpink/40 hover:shadow-[0_0_20px_rgba(255,0,127,0.15)]"
          />
        </AnimatedItem>
      </AnimatedSection>
    </section>
  );
};
