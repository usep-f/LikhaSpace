import React, { useState } from 'react';
import { X, ShieldCheck, Activity } from 'lucide-react';
import { Order } from '@/lib/types';

import { updateOrderStatus, createNotification } from '@/lib/db';
import { useNotification } from '@/context/NotificationContext';

interface QRPhPaymentModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export const QRPhPaymentModal: React.FC<QRPhPaymentModalProps> = ({ order, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const { showToast } = useNotification();

  const usdPrice = order.priceUSD;
  const phpExchangeRate = 58.00;
  const phpPrice = usdPrice * phpExchangeRate;

  // Generate a valid-looking QR Ph dynamic EMVCo payload
  const amountStr = phpPrice.toFixed(2);
  const qrPayload = `00020101021226540015ph.com.gcash.qr0124+6391234567890204demo52045999530360854${amountStr.length.toString().padStart(2, '0')}${amountStr}5802PH5910LikhaSpace6006Manila6304A1B2`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}`;

  const getMilestonesConfig = (o: Order) => {
    if (o.milestones && o.milestones.length > 0) {
      return o.milestones.map(m => ({
        payout_amount_usd: Math.round(m.payoutUSD * 100),
        max_revisions: m.maxRevisions
      }));
    }
    return [{
      payout_amount_usd: Math.round(o.priceUSD * 100),
      max_revisions: 2
    }];
  };

  const handleSimulatePayment = async () => {
    setLoading(true);
    setStep('Verifying GCash Payment via QR Ph...');
    
    // Simulate real QR Ph processing time
    await new Promise(r => setTimeout(r, 2000));
    
    setStep('Funding Relayer Wallet via Friendbot...');
    try {
      const milestonesConfig = getMilestonesConfig(order);
      
      const res = await fetch('/api/onramp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          freelancerAddress: order.freelancerAddress,
          priceUSD: order.priceUSD,
          currency: order.currency || 'XLM',
          milestones: milestonesConfig,
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to simulate on-ramp payment');
      }

      const { contractId, relayerAddress } = await res.json();

      setStep('Updating order on-chain state...');
      const defaultMilestones = order.milestones?.length ? order.milestones.map((m, idx) => ({
        ...m,
        revisionsUsed: 0,
        state: idx === 0 ? ('active' as const) : ('locked' as const),
      })) : [{
        title: 'Final Deliverable',
        payoutUSD: order.priceUSD,
        maxRevisions: 2,
        revisionsUsed: 0,
        state: 'active' as const
      }];

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: `[QR Ph On-Ramp] Escrow contract deployed & funded on-chain. Relayer wallet: ${contractId.slice(0, 4)}...${contractId.slice(-4)}`
      };

      await updateOrderStatus(order.id, { 
        status: 'escrow_funded', 
        txHash: contractId,
        relayerSecret: 'treasury', // Flag indicating this is managed by the Treasury backend
        milestones: defaultMilestones,
        currentMilestoneIdx: 0,
        progressPercentage: 0,
        changelogs: [...(order.changelogs || []), newChangelog]
      });

      await createNotification({
        recipientId: order.freelancerAddress,
        senderId: order.clientAddress,
        senderName: 'System Relayer',
        title: 'Escrow Funded (QR Ph)',
        message: `Escrow has been funded via GCash QR Ph. You can now start working on the project!`,
        type: 'escrow',
        orderId: order.id,
      });

      showToast('Escrow successfully funded via QR Ph!', 'success');
      onSuccess();
    } catch (err) {
      console.error(err);
      showToast(`Simulation failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setLoading(false);
      setStep(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#0a0712] border border-[#ff00ff]/20 rounded-3xl shadow-2xl p-6 overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#00ffff]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#ff00ff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            {/* Styled QR Ph standard-colored mock tag */}
            <div className="flex gap-0.5 px-2 py-1 rounded bg-white text-[10px] font-black uppercase tracking-wider text-black border border-gray-200">
              <span className="text-[#005cff]">Q</span>
              <span className="text-[#ff0000]">R</span>
              <span className="text-[#ffcc00]"> Ph</span>
            </div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">GCash On-Ramp</span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 border-t-2 border-b-2 border-neoncyan rounded-full animate-spin" />
              <Activity className="absolute w-5 h-5 text-[#ff00ff] animate-pulse" />
            </div>
            <p className="text-sm font-heading font-semibold text-white mt-4">{step}</p>
            <p className="text-xs text-gray-500 text-center px-4">
              This triggers a series of secure Testnet transactions behind the scenes, mimicking the anchor webhook.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* PHP price banner */}
            <div className="text-center mb-6">
              <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total Amount to Pay</span>
              <h2 className="text-3xl font-heading font-black text-white mt-1">
                ₱{phpPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP
              </h2>
              <p className="text-[10px] text-gray-500 mt-1">Converted from ${usdPrice} USD @ ₱{phpExchangeRate}/USD</p>
            </div>

            {/* Rendered QR Code */}
            <div className="bg-white p-4 rounded-2xl shadow-[0_0_25px_rgba(0,255,255,0.05)] border border-white/10 flex items-center justify-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={qrCodeUrl} 
                alt="QR Ph Payment Code" 
                className="w-48 h-48 object-contain"
              />
            </div>

            {/* Instruction Alert */}
            <div className="flex items-start gap-3 bg-neoncyan/10 border border-neoncyan/20 p-4 rounded-xl mb-6 w-full">
              <ShieldCheck className="w-5 h-5 text-neoncyan shrink-0 mt-0.5" />
              <div className="text-[10px] text-neoncyan leading-relaxed">
                <p className="font-bold">National QR Ph Integration Enabled</p>
                <p className="mt-0.5">Scan this QR Ph using GCash, Maya, or any PH banking app to simulate on-chain contract funding.</p>
              </div>
            </div>

            {/* Simulate Button */}
            <button
              onClick={handleSimulatePayment}
              className="w-full py-3 rounded-xl bg-hotpink text-white font-heading font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(255,0,127,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Simulate Scan & GCash Pay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
