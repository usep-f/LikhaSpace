'use client';

import { X, AlertTriangle } from 'lucide-react';
import { Order } from '@/lib/mockGigs';

export interface CancelModalProps {
  order: Order;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({ order, onClose, onConfirm }) => {
  const currentIdx = order.currentMilestoneIdx ?? 0;
  const milestones = order.milestones ?? [];
  const currentMilestone = milestones[currentIdx];
  const isSubmitted = currentMilestone?.state === 'submitted';

  // Financial calculations
  const completedMilestones = milestones.slice(0, currentIdx);
  const completedPayout = completedMilestones.reduce((sum, m) => sum + m.payoutUSD, 0);

  const activeMilestonePayout = currentMilestone ? currentMilestone.payoutUSD : 0;
  const killFee = activeMilestonePayout * 0.75;
  const activeMilestoneRefund = activeMilestonePayout - killFee;

  const futureMilestones = milestones.slice(currentIdx + 1);
  const futureRefund = futureMilestones.reduce((sum, m) => sum + m.payoutUSD, 0);

  const freelancerTotal = completedPayout + killFee;
  const clientRefund = activeMilestoneRefund + futureRefund;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-obsidian border border-red-500/20 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-red-950/20">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-heading font-bold text-base text-white">Cancel Project</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Warning Message */}
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-2">
            <p className="text-xs text-red-300 leading-relaxed font-semibold">
              Warning: Canceling this project is irreversible.
            </p>
            {isSubmitted && (
              <p className="text-[11px] text-yellow-300 leading-relaxed">
                Notice: The freelancer has submitted a deliverable for the current milestone. If you are unhappy with the quality of the work, please request a revision or mediation instead of canceling.
              </p>
            )}
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Cancellation Financial Breakdown</h4>
            <div className="bg-obsidian border border-white/5 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Completed Milestones (Kept):</span>
                <span className="text-white font-medium">${completedPayout.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-xs border-b border-white/5 pb-2.5">
                <span className="text-hotpink font-bold">75% Kill-Fee (Current Active Milestone):</span>
                <span className="text-hotpink font-bold">${killFee.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-neongreen font-semibold">Your Total Refund:</span>
                <span className="text-neongreen font-bold">${clientRefund.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {/* Final Summary Card */}
          <div className="grid grid-cols-2 gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Freelancer Keeps</p>
              <p className="text-lg font-bold text-white mt-0.5">${freelancerTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-neongreen">Client Refunded</p>
              <p className="text-lg font-bold text-neongreen mt-0.5">${clientRefund.toFixed(2)}</p>
            </div>
          </div>

          <p className="text-[10px] text-gray-500 italic text-center">
            * Refunds are processed on-chain using the native XLM conversion rate stored at funding time.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/5 bg-obsidian">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-white/5 border border-white/10 text-white font-heading text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white font-heading text-xs font-bold border border-red-700/50 hover:bg-red-700 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer"
          >
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  );
};
