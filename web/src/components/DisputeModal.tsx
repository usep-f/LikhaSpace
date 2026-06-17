'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Flame, ShieldAlert, Coins, Clock } from 'lucide-react';
import { Order } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';
import { updateOrderStatus } from '@/lib/db';
import {
  getLockedBalance,
  getDisputeProposal,
  proposeDisputeSplit,
  acceptDisputeSplit,
  rejectDisputeSplit,
  claimDisputeTimeout,
  escalateToMediator,
  DisputeProposal,
} from '@/lib/contract';

export interface DisputeModalProps {
  order: Order;
  currentAddress: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  order,
  currentAddress,
  onClose,
  onSuccess,
}) => {
  const [split, setSplit] = useState<number>(50); // Freelancer split %
  const [lockedBalance, setLockedBalance] = useState<bigint | null>(null);
  const [proposal, setProposal] = useState<DisputeProposal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { showToast, showLoading, hideLoading } = useNotification();

  const loadDisputeData = React.useCallback(async () => {
    if (!order.txHash) return;
    try {
      setIsLoading(true);
      const [bal, prop] = await Promise.all([
        getLockedBalance(order.txHash, currentAddress),
        getDisputeProposal(order.txHash, currentAddress),
      ]);
      setLockedBalance(bal);
      setProposal(prop);
    } catch (err) {
      console.error('Failed to load dispute details:', err);
      showToast('Error loading dispute data from blockchain.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [order.txHash, currentAddress, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDisputeData();
  }, [loadDisputeData]);

  const formatXlm = (stroops: bigint) => {
    return (Number(stroops) / 10000000).toFixed(2) + ' XLM';
  };

  const handlePropose = async () => {
    if (!order.txHash || lockedBalance === null) return;
    try {
      showLoading('Submitting split proposal...');
      const fPayoutStroops = (lockedBalance * BigInt(split)) / BigInt(100);
      const cRefundStroops = lockedBalance - fPayoutStroops;

      await proposeDisputeSplit(
        order.txHash,
        currentAddress,
        fPayoutStroops.toString(),
        cRefundStroops.toString()
      );

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: `Dispute split proposed by ${
          currentAddress === order.clientAddress ? 'Client' : 'Freelancer'
        } (Freelancer: ${split}%, Client: ${100 - split}%).`,
      };

      await updateOrderStatus(order.id, {
        changelogs: [...(order.changelogs || []), newChangelog],
      });

      showToast('Split proposed successfully!', 'success');
      onSuccess();
    } catch (err) {
      console.error(err);
      showToast('Failed to propose split.', 'error');
    } finally {
      hideLoading();
    }
  };

  const handleAccept = async () => {
    if (!order.txHash) return;
    try {
      showLoading('Accepting split proposal...');
      await acceptDisputeSplit(order.txHash, currentAddress);

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: 'Dispute split proposal accepted by the responding party.',
      };

      await updateOrderStatus(order.id, {
        status: 'settled_dispute',
        progressPercentage: 100,
        changelogs: [...(order.changelogs || []), newChangelog],
      });

      showToast('Dispute resolved & payout executed!', 'success');
      onSuccess();
    } catch (err) {
      console.error(err);
      showToast('Failed to accept proposal.', 'error');
    } finally {
      hideLoading();
    }
  };

  const handleReject = async () => {
    if (!order.txHash) return;
    try {
      showLoading('Rejecting and burning funds...');
      await rejectDisputeSplit(order.txHash, currentAddress);

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: 'Dispute split proposal rejected. Remaining funds permanently burned.',
      };

      await updateOrderStatus(order.id, {
        status: 'denied',
        progressPercentage: 100,
        changelogs: [...(order.changelogs || []), newChangelog],
      });

      showToast('Dispute rejected. Remaining funds burned.', 'info');
      onSuccess();
    } catch (err) {
      console.error(err);
      showToast('Failed to reject proposal.', 'error');
    } finally {
      hideLoading();
    }
  };

  const handleTimeout = async () => {
    if (!order.txHash) return;
    try {
      showLoading('Executing 50/50 timeout split...');
      await claimDisputeTimeout(order.txHash, currentAddress);

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: '7-day dispute timeout elapsed. Default 50/50 split executed.',
      };

      await updateOrderStatus(order.id, {
        status: 'settled_dispute',
        progressPercentage: 100,
        changelogs: [...(order.changelogs || []), newChangelog],
      });

      showToast('Timeout fallback executed (50/50 split)!', 'success');
      onSuccess();
    } catch (err) {
      console.error(err);
      showToast('Timeout execution failed. Is 7 days elapsed?', 'error');
    } finally {
      hideLoading();
    }
  };

  const handleInvokeMediator = async () => {
    if (!order.txHash) return;
    try {
      showLoading('Invoking mediator on-chain...');
      await escalateToMediator(order.txHash, currentAddress);

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: `Mediator invoked by ${
          currentAddress === order.clientAddress ? 'Client' : 'Freelancer'
        }. Direct negotiation closed.`,
      };

      await updateOrderStatus(order.id, {
        status: 'mediation',
        changelogs: [...(order.changelogs || []), newChangelog],
      });

      showToast('Mediator successfully invoked!', 'success');
      onSuccess();
    } catch (err) {
      console.error(err);
      showToast('Failed to invoke mediator.', 'error');
    } finally {
      hideLoading();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-obsidian border border-white/5 p-8 rounded-2xl flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-t-neoncyan border-white/10 rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400 mt-4">Reading blockchain state...</p>
        </div>
      </div>
    );
  }

  const isProposer = proposal?.proposer === currentAddress;
  const totalUSD = order.priceUSD;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-obsidian border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.1)] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2 text-neoncyan">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-heading font-bold text-base text-white">Dispute Panel</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {lockedBalance !== null && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Locked dispute Balance</p>
              <p className="text-xl font-bold text-neoncyan mt-1">{formatXlm(lockedBalance)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Budget reference: ${totalUSD} USD</p>
            </div>
          )}

          {order.status === 'mediation' ? (
            /* Mediator Invoked Panel */
            <div className="space-y-4">
              <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-xl space-y-3 text-center">
                <ShieldAlert className="w-10 h-10 text-orange-500 mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Mediator Invoked</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Either you or the other party has invoked the mediator to settle this dispute. 
                  Direct negotiation is now closed, and the final split settlement rests solely in the hands of the mediator.
                </p>
              </div>
            </div>
          ) : !proposal ? (
            /* Propose split panel */
            <div className="space-y-4">
              <div className="bg-neoncyan/10 border border-neoncyan/20 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <Coins className="w-4 h-4 text-neoncyan" /> Define Split Proposal (The Cut)
                </h4>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Propose a split. The other party will have the option to either **Accept** this split or **Reject** it (burning all remaining funds). Propose fairly to encourage acceptance!
                </p>
              </div>

              <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs font-mono text-white">
                  <span>Freelancer: {split}%</span>
                  <span>Client: {100 - split}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                  className="w-full accent-neoncyan cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Payout: ${((totalUSD * split) / 100).toFixed(2)} USD</span>
                  <span>Refund: ${((totalUSD * (100 - split)) / 100).toFixed(2)} USD</span>
                </div>
              </div>

              <button
                onClick={handlePropose}
                className="w-full py-2.5 rounded bg-neoncyan text-obsidian font-heading font-bold text-xs uppercase tracking-wider hover:bg-neoncyan/80 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,255,255,0.2)]"
              >
                Propose split settlement
              </button>

              <div className="pt-2 border-t border-white/5 mt-4">
                <button
                  onClick={handleInvokeMediator}
                  className="w-full py-2 rounded border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" /> Invoke Mediator
                </button>
              </div>
            </div>
          ) : isProposer ? (
            /* Proposal submitted, waiting for response / timeout */
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-4 h-4 text-yellow-500" /> Split Proposal Submitted
                </h4>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  You proposed a split: **Freelancer keeps {formatXlm(proposal.freelancerPayout)}**, **Client gets {formatXlm(proposal.clientRefund)}**.
                </p>
                <p className="text-[11px] text-gray-400 italic">
                  Waiting for the other party to respond. If they do not respond within 7 days, you can claim the 50/50 timeout fallback below.
                </p>
              </div>

              <button
                onClick={handleTimeout}
                className="w-full py-2.5 rounded border border-yellow-500 text-yellow-500 bg-yellow-500/5 font-heading font-bold text-xs uppercase tracking-wider hover:bg-yellow-500/20 transition-all cursor-pointer"
              >
                Execute 50/50 Timeout Split
              </button>

              <div className="pt-2 border-t border-white/5 mt-4">
                <button
                  onClick={handleInvokeMediator}
                  className="w-full py-2 rounded border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" /> Invoke Mediator
                </button>
              </div>
            </div>
          ) : (
            /* Decision panel for opposite party */
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" /> Proposed Split Split
                </h4>
                <div className="bg-obsidian border border-white/5 rounded-lg p-3 space-y-1.5 text-xs text-white">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Freelancer Payout:</span>
                    <span className="font-bold text-neongreen">{formatXlm(proposal.freelancerPayout)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Client Refund:</span>
                    <span className="font-bold text-neoncyan">{formatXlm(proposal.clientRefund)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleAccept}
                  className="w-full py-2.5 rounded bg-neongreen text-obsidian font-heading font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_10px_rgba(57,255,20,0.3)] transition-all cursor-pointer"
                >
                  Accept Payout Split
                </button>
                
                <button
                  onClick={handleReject}
                  className="w-full py-2.5 rounded bg-red-600 text-white font-heading font-bold text-xs uppercase tracking-wider flex justify-center items-center gap-1.5 hover:bg-red-700 transition-colors cursor-pointer"
                >
                  <Flame className="w-4 h-4" /> Reject & Burn Funds
                </button>
                <p className="text-[10px] text-center text-red-500 italic mt-1">
                  * Warning: Rejecting will permanently burn the remaining XLM funds, giving $0 to both parties.
                </p>

                <div className="pt-2 border-t border-white/5 mt-4">
                  <button
                    onClick={handleInvokeMediator}
                    className="w-full py-2 rounded border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" /> Invoke Mediator
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
