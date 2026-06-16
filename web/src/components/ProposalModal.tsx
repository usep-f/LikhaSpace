import React, { useState, useEffect } from 'react';
import { Order, Gig } from '@/lib/types';
import { X, User, Briefcase, FileText } from 'lucide-react';
import { getGig } from '@/lib/db';

interface ProposalModalProps {
  order: Order;
  onClose: () => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({ order, onClose }) => {
  const [gigInfo, setGigInfo] = useState<Gig | null>(null);

  useEffect(() => {
    getGig(order.gigId).then(setGigInfo).catch(console.error);
  }, [order.gigId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-violet-dark border border-white/10 rounded-2xl shadow-2xl p-6">

        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <h2 className="text-xl font-heading font-bold text-white">Client Proposal</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">

          {/* Client Info */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-neoncyan/10 rounded-lg border border-neoncyan/20">
              <User className="w-5 h-5 text-neoncyan" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-0.5">Requested By</p>
              <p className="text-sm font-bold text-white">{order.clientName}</p>
              <p className="text-xs text-gray-500 font-mono">{order.clientAddress}</p>
            </div>
          </div>

          {/* Gig Info */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-hotpink/10 rounded-lg border border-hotpink/20">
              <Briefcase className="w-5 h-5 text-hotpink" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-0.5">Target Service</p>
              <p className="text-sm font-bold text-white mb-1">{gigInfo?.title || 'Unknown Service'}</p>
              <p className="text-xs text-gray-400">Total: <span className="font-bold text-white">${order.priceUSD} USD</span></p>
            </div>
          </div>

          {/* Proposal Text */}
          <div className="bg-obsidian border border-white/5 rounded-xl p-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-gray-400" />
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Client Requirements</p>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed italic bg-white/5 p-4 rounded-lg border border-white/5">
              &quot;{order.proposalText || 'No additional requirements provided by the client.'}&quot;
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
