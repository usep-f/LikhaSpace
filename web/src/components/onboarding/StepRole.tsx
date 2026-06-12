import React from 'react';
import { StepProps } from './types';
import { Palette, Briefcase } from 'lucide-react';
import { UserRole } from '@/context/WalletContext';

export const StepRole: React.FC<StepProps> = ({ formData, updateData, onNext }) => {
  const selectRole = (role: UserRole) => {
    updateData({ role });
    onNext(role);
  };

  return (
    <div className="space-y-6 animate-step-pop">
      <div className="text-center mb-8">
        <h2 className="font-heading text-3xl font-bold text-white mb-2">Join LikhaSpace</h2>
        <p className="text-gray-400">Choose how you want to interact with the platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => selectRole('artist')}
          className={`text-left p-6 rounded-xl glass-card border transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
            formData.role === 'artist'
              ? 'border-hotpink shadow-[0_0_15px_rgba(255,0,127,0.4)] bg-white/10'
              : 'border-white/10 hover:border-hotpink/50 hover:shadow-[0_0_12px_rgba(255,0,127,0.2)]'
          }`}
        >
          <div className="flex flex-col h-full space-y-4">
            <div className="p-3 rounded-lg bg-hotpink/10 w-fit">
              <Palette className="w-8 h-8 text-hotpink" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-white mb-2">Freelancer</h3>
              <p className="text-sm text-gray-400">
                Showcase your skills, build on-chain reputation, and receive secure zero-fee escrow payments.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => selectRole('client')}
          className={`text-left p-6 rounded-xl glass-card border transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
            formData.role === 'client'
              ? 'border-neoncyan shadow-[0_0_15px_rgba(0,243,255,0.4)] bg-white/10'
              : 'border-white/10 hover:border-neoncyan/50 hover:shadow-[0_0_12px_rgba(0,243,255,0.2)]'
          }`}
        >
          <div className="flex flex-col h-full space-y-4">
            <div className="p-3 rounded-lg bg-neoncyan/10 w-fit">
              <Briefcase className="w-8 h-8 text-neoncyan" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-white mb-2">Project Client</h3>
              <p className="text-sm text-gray-400">
                Find premium Filipino talent, set budgets, fund escrows, and manage deliverables.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
