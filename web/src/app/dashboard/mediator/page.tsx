'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { ShieldAlert } from 'lucide-react';
import { getDisputedOrders, updateOrderStatus } from '@/lib/db';
import { resolveDispute } from '@/lib/contract';
import { useNotification } from '@/context/NotificationContext';
import { Order } from '@/lib/mockGigs';

const DisputedCaseCard: React.FC<{ order: Order; onResolved: () => void }> = ({ order, onResolved }) => {
  const [split, setSplit] = useState<number>(50);
  const { showToast } = useNotification();
  const { address } = useWallet();

  const handleResolve = async () => {
    if (!address) return showToast('Wallet not connected', 'error');
    if (!order.txHash) return showToast('Missing contract ID (txHash)', 'error');
    
    const totalCents = order.priceUSD * 100;
    const freelancerPayoutUsdCents = Math.floor(totalCents * (split / 100));
    const clientRefundUsdCents = totalCents - freelancerPayoutUsdCents;

    showToast('Resolving dispute on-chain...', 'info');
    try {
      // For sandbox, Oracle Mock returns 1 XLM = $0.10. Therefore 1 USD = 10 XLM.
      const stroopsPerUsdCents = 1000000; // 1 USD = 10 XLM = 100,000,000 stroops, so 1 cent = 1,000,000 stroops
      const fPayoutStroops = freelancerPayoutUsdCents * stroopsPerUsdCents;
      const cRefundStroops = clientRefundUsdCents * stroopsPerUsdCents;

      await resolveDispute(
        order.txHash,
        address,
        fPayoutStroops.toString(),
        cRefundStroops.toString()
      );

      await updateOrderStatus(order.id, { status: 'completed' });
      showToast('Dispute successfully resolved on-chain!', 'success');
      onResolved();
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      showToast(`Resolution failed: ${msg}`, 'error');
    }
  };

  return (
    <div className="p-6 rounded-xl glass-card border border-white/5 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <p className="text-xs text-gray-300 font-bold">Disputed Case: {order.id}</p>
          <div className="bg-white/5 p-3 rounded-lg text-xs space-y-1 text-gray-400">
            <p><strong>Freelancer:</strong> {order.freelancerAddress}</p>
            <p><strong>Client:</strong> {order.clientAddress}</p>
            <p><strong>Total Budget:</strong> {order.priceUSD} USD</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-gray-300 font-bold">Proposed Settlement Split</p>
          <div className="space-y-2">
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
              className="w-full accent-neoncyan"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Freelancer USD: ${(order.priceUSD * (split / 100)).toFixed(2)}</span>
              <span>Client USD: ${(order.priceUSD * ((100 - split) / 100)).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={handleResolve} className="w-full py-2 rounded bg-neoncyan text-obsidian font-heading font-bold text-xs uppercase tracking-wider hover:bg-neoncyan/80 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,255,255,0.4)]">
            Execute Resolution
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MediatorDashboard() {
  const { isConnected } = useWallet();
  const [disputedOrders, setDisputedOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    try {
      const orders = await getDisputedOrders();
      setDisputedOrders(orders);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-obsidian text-white py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-left border-b border-white/5 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-hotpink text-glow-pink" />
          <span>Mediator Arbitration console</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {isConnected
            ? 'Review disputed projects, configure settlement splits, and resolve contracts.'
            : 'Connect wallet to sync.'}
        </p>
      </div>

      <div className="space-y-6">
        {disputedOrders.length > 0 ? (
          disputedOrders.map((order) => (
            <DisputedCaseCard key={order.id} order={order} onResolved={fetchOrders} />
          ))
        ) : (
          <div className="p-12 rounded-xl glass-card border border-white/5 text-center">
            <p className="text-gray-400 text-sm">No active disputes found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
