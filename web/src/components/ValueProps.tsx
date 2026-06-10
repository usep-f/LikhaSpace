'use client';

import React from 'react';
import { DollarSign, ShieldAlert, Award } from 'lucide-react';

interface PropCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  borderColorClass: string;
}

const PropCard: React.FC<PropCardProps> = ({ title, description, icon, borderColorClass }) => (
  <div className={`p-6 rounded-xl glass-card border border-white/5 hover:border-solid hover:scale-[1.01] ${borderColorClass}`}>
    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="font-heading font-bold text-lg text-white mb-2">{title}</h3>
    <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
  </div>
);

export const ValueProps: React.FC = () => {
  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="font-heading text-3xl font-bold text-white tracking-tight">
          Why Choose <span className="text-hotpink text-glow-pink">LikhaSpace</span>?
        </h2>
        <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
          We combine the speed and economy of the Stellar blockchain with standard freelance agreements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PropCard
          title="Zero Platform Fees"
          description="Traditional platforms extract 10% to 20% of your earnings. LikhaSpace takes 0%, with Stellar transactions costing less than $0.0001."
          icon={<DollarSign className="w-6 h-6 text-neongreen" />}
          borderColorClass="hover:border-neongreen/40 hover:shadow-[0_0_12px_rgba(57,255,20,0.15)]"
        />
        
        <PropCard
          title="Soroban Escrows"
          description="Clients deposit funds into public, audited smart contracts. Freelancers receive up to 50% upfront payouts, with the rest locked until delivery."
          icon={<ShieldAlert className="w-6 h-6 text-hotpink" />}
          borderColorClass="hover:border-hotpink/40 hover:shadow-[0_0_12px_rgba(255,0,127,0.15)]"
        />
        
        <PropCard
          title="On-Chain Reputation"
          description="Build trust immutably. Your completed project count, active delivery streak, and total XLM earned are recorded directly on the blockchain."
          icon={<Award className="w-6 h-6 text-neoncyan" />}
          borderColorClass="hover:border-neoncyan/40 hover:shadow-[0_0_12px_rgba(0,243,255,0.15)]"
        />
      </div>
    </section>
  );
};
