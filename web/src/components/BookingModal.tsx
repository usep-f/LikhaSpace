import React, { useState } from 'react';
import { Gig } from '@/lib/mockGigs';
import { X, ShieldAlert, ArrowRight } from 'lucide-react';

interface BookingModalProps {
  gig: Gig;
  onClose: () => void;
  onConfirm: (gig: Gig, message: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ gig, onClose, onConfirm }) => {
  const [message, setMessage] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-violet-dark border border-white/10 rounded-2xl shadow-2xl p-6">

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-heading font-bold text-white mb-1">Request to Book</h2>
            <p className="text-xs text-gray-400">Send a request to {gig.freelancerName}</p>
          </div>
          <button
             onClick={onClose}
             className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Order Summary */}
        <div className="bg-obsidian border border-white/5 rounded-xl p-4 mb-6">
          <p className="text-sm font-bold text-white mb-2">{gig.title}</p>
          <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3 mt-3">
            <span className="text-gray-400">Total Budget</span>
            <span className="font-bold text-white">${gig.priceUSD} USD</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-2">
            <span className="text-gray-400">Required Upfront ({gig.upfrontPercentage}%)</span>
            <span className="font-bold text-neongreen">${(gig.priceUSD * (gig.upfrontPercentage / 100)).toFixed(2)} USD</span>
          </div>
        </div>

        {/* Initial Message Input */}
        <div className="mb-6">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
            Initial Message / Requirements (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Briefly describe what you need..."
            className="w-full bg-obsidian border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-hotpink transition-colors resize-none h-24"
          />
        </div>

        {/* Escrow Warning */}
        <div className="flex items-start gap-3 bg-neoncyan/10 border border-neoncyan/20 p-3 rounded-lg mb-6">
          <ShieldAlert className="w-5 h-5 text-neoncyan shrink-0 mt-0.5" />
          <p className="text-[10px] text-neoncyan leading-relaxed">
            By sending this request, you agree to fund the Soroban smart contract escrow if the freelancer accepts. Your funds are protected until you approve the final deliverable.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-white/5 text-white font-heading font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(gig, message)}
            className="flex-1 py-2.5 rounded-lg bg-hotpink text-white font-heading font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(255,0,127,0.4)] transition-all flex items-center justify-center gap-2"
          >
            Send Request <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
