import React from 'react';
import { StepProps } from './types';
import { CheckCircle, Rocket } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

export const StepSuccess: React.FC<StepProps> = ({ formData, onNext }) => {
  const { role } = useWallet();
  const isClient = role === 'client';

  return (
    <div className="space-y-6 animate-step-pop flex flex-col items-center text-center py-8">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
        <div className="relative bg-primary/10 p-4 rounded-full border border-primary/30">
          <CheckCircle className="w-16 h-16 text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-3xl font-bold text-white">Welcome aboard, {formData.name.split(' ')[0]}!</h2>
        <p className="text-gray-400 max-w-sm mx-auto">
          Your profile has been securely registered on the Stellar blockchain.
        </p>
      </div>

      <div className="p-4 rounded-xl glass-card border border-white/5 w-full max-w-sm text-sm text-slate-300">
        {isClient ? (
          <p>You are now ready to hire top-tier Filipino talent and manage your projects with zero-fee escrow.</p>
        ) : (
          <p>You are now ready to discover premium gigs and receive secure payments directly to your wallet.</p>
        )}
      </div>

      <div className="pt-8 w-full max-w-sm">
        <button 
          onClick={() => onNext()}
          className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
        >
          <Rocket className="w-5 h-5" />
          <span>Proceed to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
