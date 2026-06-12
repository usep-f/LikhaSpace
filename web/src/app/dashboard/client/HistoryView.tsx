'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { ShieldCheck } from 'lucide-react';
import { Order, Gig } from '@/lib/mockGigs';
import { getClientOrders, getGig } from '@/lib/db';

export const HistoryView: React.FC = () => {
  const { address } = useWallet();
  const [completedOrders, setCompletedOrders] = useState<(Order & { gigInfo?: Gig })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  React.useEffect(() => {
    if (!address) return;
    getClientOrders(address)
      .then(async (orders) => {
        const completed = orders.filter(o => o.status === 'completed' || o.status === 'denied');
        const enriched = await Promise.all(
          completed.map(async (o) => {
            const gigInfo = await getGig(o.gigId);
            return { ...o, gigInfo: gigInfo || undefined };
          })
        );
        setCompletedOrders(enriched);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load client history:', err);
        setLoading(false);
      });
  }, [address]);

  if (loading) {
    return (
      <div className="text-center py-12 text-sm text-gray-400">
        Loading transaction history...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-bold text-lg text-white">Booking History</h3>
      <div className="space-y-4">
        {completedOrders.length > 0 ? (
          completedOrders.map(order => (
            <div key={order.id} className="p-6 rounded-xl glass-card border border-white/5 flex flex-col gap-4">
               <div className="flex justify-between items-start">
                 <div>
                     <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${
                       order.status === 'completed' ? 'text-neongreen' : 'text-red-400'
                     }`}>
                       {order.status === 'completed' ? 'Completed Order' : 'Cancelled Order'}
                     </p>
                    <p className="text-sm font-bold text-white flex items-center gap-1">
                      Freelancer: {order.gigInfo?.freelancerName || order.freelancerAddress}
                      <ShieldCheck className="w-3.5 h-3.5 text-neongreen" />
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Total: ${order.priceUSD} USD</p>
                 </div>
                 <div className="text-right">
                    {order.txHash && (
                      <p className="text-[10px] text-gray-500 font-mono mt-1">Tx: {order.txHash.slice(0, 16)}...</p>
                    )}
                 </div>
               </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center border border-white/5 rounded-xl glass-card">
            <p className="text-sm text-gray-400">No completed history found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
