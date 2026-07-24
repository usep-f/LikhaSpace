import React from 'react';
import { X, Coins } from 'lucide-react';

interface TokenSelectionModalProps {
  onSelect: (currency: 'XLM' | 'USDC') => void;
  onClose: () => void;
}

export const TokenSelectionModal: React.FC<TokenSelectionModalProps> = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-[#0a0712] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#00ffff]" />
            <h3 className="text-lg font-heading font-black text-white uppercase tracking-widest">Select Currency</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          How would you like to fund this project?
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onSelect('XLM')}
            className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all group flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-white mb-1">XLM (Stellar Native)</div>
              <div className="text-xs text-gray-400">Fund using native XLM tokens.</div>
            </div>
            <div className="text-xs text-[#00ffff] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Select</div>
          </button>

          <button
            onClick={() => onSelect('USDC')}
            className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all group flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-white mb-1">USDC (Circle Stablecoin)</div>
              <div className="text-xs text-gray-400">Fund using USD Coin on Stellar.</div>
            </div>
            <div className="text-xs text-[#00ffff] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Select</div>
          </button>
        </div>

      </div>
    </div>
  );
};
