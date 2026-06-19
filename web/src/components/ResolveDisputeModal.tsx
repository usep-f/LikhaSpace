'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Coins } from 'lucide-react';
import { Order } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';
import { updateOrderStatus, createNotification } from '@/lib/db';
import { getLockedBalance, resolveDispute } from '@/lib/contract';

export interface ResolveDisputeModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResolveDisputeModal: React.FC<ResolveDisputeModalProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const [split, setSplit] = useState<number>(50); // Freelancer split %
  const [lockedBalance, setLockedBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { showToast, showLoading, hideLoading } = useNotification();

  const currentAddress = process.env.NEXT_PUBLIC_MEDIATOR_ADDRESS!;

  const loadDisputeData = React.useCallback(async () => {
    if (!order.txHash) return;
    try {
      setIsLoading(true);
      const bal = await getLockedBalance(order.txHash, currentAddress);
      setLockedBalance(bal);
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

  const handleResolve = async () => {
    if (!order.txHash || lockedBalance === null) return;
    try {
      showLoading('Executing mediator resolution...');
      const fPayoutStroops = (lockedBalance * BigInt(split)) / BigInt(100);
      const cRefundStroops = lockedBalance - fPayoutStroops;

      await resolveDispute(
        order.txHash,
        currentAddress,
        fPayoutStroops.toString(),
        cRefundStroops.toString()
      );

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: `Dispute resolved by Mediator (Freelancer: ${split}%, Client: ${100 - split}%).`,
      };

      await updateOrderStatus(order.id, {
        status: 'settled_dispute',
        progressPercentage: 100,
        changelogs: [...(order.changelogs || []), newChangelog],
      });

      // Notify Freelancer
      await createNotification({
        recipientId: order.freelancerAddress,
        senderId: currentAddress,
        senderName: 'Mediator',
        title: 'Dispute Resolved',
        message: `The mediator has resolved the dispute. You received ${split}% of the locked funds.`,
        type: 'dispute',
        orderId: order.id,
      });

      // Notify Client
      await createNotification({
        recipientId: order.clientAddress,
        senderId: currentAddress,
        senderName: 'Mediator',
        title: 'Dispute Resolved',
        message: `The mediator has resolved the dispute. You received ${100 - split}% of the locked funds.`,
        type: 'dispute',
        orderId: order.id,
      });

      showToast('Dispute successfully resolved!', 'success');
      onSuccess();
    } catch (err) {
      console.error(err);
      showToast('Failed to resolve dispute.', 'error');
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

  const totalUSD = order.priceUSD;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-obsidian border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.1)] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2 text-neoncyan">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-heading font-bold text-base text-white">Mediator Resolution</h3>
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

          <div className="space-y-4">
            <div className="bg-neoncyan/10 border border-neoncyan/20 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <Coins className="w-4 h-4 text-neoncyan" /> Enforce Split Settlement
              </h4>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                As a mediator, your decision is final. Determine the percentage split of the remaining locked funds to be distributed to the Freelancer and the Client.
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
              onClick={handleResolve}
              className="w-full py-2.5 rounded bg-neoncyan text-obsidian font-heading font-bold text-xs uppercase tracking-wider hover:bg-neoncyan/80 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,255,255,0.2)]"
            >
              Execute Final Settlement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
