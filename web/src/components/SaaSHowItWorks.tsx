'use client';

import React from 'react';
import { FileText, Lock, UploadCloud, CheckCircle } from 'lucide-react';
import { AnimatedSection, AnimatedItem } from '@/components/ui/AnimatedSection';

export interface SaaSHowItWorksProps {
  className?: string;
}

interface StepCardProps {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  borderClass: string;
}

const StepCard: React.FC<StepCardProps> = ({ step, title, description, icon, borderClass }) => (
  <div className={`p-6 rounded-2xl glass-card border border-white/5 hover:scale-[1.02] flex flex-col justify-between cursor-pointer transition-all duration-350 ${borderClass}`}>
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-heading font-black tracking-widest text-gray-500 uppercase">
          {step}
        </span>
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="font-heading font-bold text-lg text-white mb-2">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  </div>
);



export const SaaSHowItWorks: React.FC<SaaSHowItWorksProps> = () => {
  const steps = [
    {
      step: 'Step 01',
      title: 'Milestone Agreement',
      description: 'Client and freelancer agree on project milestones, pricing in USD, and revision counts before locking the contract.',
      icon: <FileText className="w-5 h-5 text-gray-300" />,
      borderClass: 'hover:border-white/20',
    },
    {
      step: 'Step 02',
      title: 'On-Chain Funding',
      description: 'Client locks the milestone budget in XLM using the active oracle exchange rate. Funds remain secured inside the smart contract.',
      icon: <Lock className="w-5 h-5 text-hotpink" />,
      borderClass: 'hover:border-hotpink/40 hover:shadow-[0_0_20px_rgba(255,0,127,0.15)]',
    },
    {
      step: 'Step 03',
      title: 'Submit Deliverables',
      description: 'The freelancer works and uploads proof of work directly to the platform, notifying the client and updating the milestone state.',
      icon: <UploadCloud className="w-5 h-5 text-neoncyan" />,
      borderClass: 'hover:border-neoncyan/40 hover:shadow-[0_0_20px_rgba(0,243,255,0.15)]',
    },
    {
      step: 'Step 04',
      title: 'Payment Released',
      description: 'Client accepts the work, automatically triggering the contract to release XLM to the freelancer and writing reviews to their reputation.',
      icon: <CheckCircle className="w-5 h-5 text-neongreen" />,
      borderClass: 'hover:border-neongreen/40 hover:shadow-[0_0_20px_rgba(57,255,20,0.15)]',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-white/5">
      <AnimatedSection className="text-center mb-12">
        <h2 className="font-heading text-3xl font-bold text-white tracking-tight">
          How <span className="text-transparent bg-clip-text bg-gradient-to-r from-hotpink to-neoncyan text-glow-pink text-shimmer-gradient">LikhaSpace</span> Works
        </h2>
        <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
          Secure, direct, and automated agreements driven by on-chain smart contracts.
        </p>
      </AnimatedSection>

      <AnimatedSection stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
        {steps.map((s, idx) => (
          <AnimatedItem key={s.step} className="relative col-span-1">
            <StepCard {...s} />
            {idx < steps.length - 1 && (
              <div className="hidden lg:flex absolute top-1/2 -right-8 w-8 -translate-y-1/2 items-center justify-center z-20 pointer-events-none" aria-hidden="true">
                <div className="relative w-full flex items-center">
                  <div className="h-[2px] w-full bg-gradient-to-r from-white/10 via-hotpink/40 to-neoncyan/40 animate-draw-line" />
                  <div className="absolute right-0 w-2 h-2 rounded-full bg-neoncyan shadow-[0_0_8px_rgba(0,243,255,0.6)]" />
                </div>
              </div>
            )}
          </AnimatedItem>
        ))}
      </AnimatedSection>
    </section>
  );
};
