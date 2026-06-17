'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Sparkles } from 'lucide-react';
import { Order } from '@/lib/types';
import { getFreelancerOrders } from '@/lib/db';
import { UserWalletInfo } from '@/components/ui/UserWalletInfo';

export const HistoryView: React.FC = () => {
  const { address } = useWallet();
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!address) return;
    getFreelancerOrders(address)
      .then(orders => {
        setCompletedOrders(orders.filter(o => o.status === 'completed' || o.status === 'denied' || o.status === 'settled_dispute'));
      })
      .catch(console.error);
  }, [address]);

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-bold text-lg text-white">Transaction History</h3>
      <div className="space-y-4">
        {completedOrders.length > 0 ? (
          completedOrders.map(order => (
            <div key={order.id} className="p-6 rounded-xl glass-card border border-white/5 flex flex-col gap-4">
               <div className="flex justify-between items-start">
                 <div>
                   <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${
                     order.status === 'completed' ? 'text-green-400' : 
                     order.status === 'settled_dispute' ? 'text-yellow-500' : 'text-red-400'
                   }`}>
                     {order.status === 'completed' ? 'Completed Order' : 
                      order.status === 'settled_dispute' ? 'Settled Dispute' : 'Cancelled Order'}
                   </p>
                   <UserWalletInfo
                     address={order.clientAddress}
                     role="client"
                     fallbackName={order.clientName}
                     className="mb-1"
                   />
                   <p className="text-xs text-gray-400 mt-1">Total: ${order.priceUSD} USD</p>
                 </div>
                 <div className="text-right">
                   {order.txHash && (
                     <p className="text-[10px] text-gray-500 font-mono mt-1">Tx: {order.txHash.slice(0, 16)}...</p>
                   )}
                 </div>
               </div>
               
               {order.review && (
                 <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                   <div className="flex items-center gap-1 mb-1">
                     {[...Array(5)].map((_, i) => (
                       <Sparkles key={i} className={`w-3 h-3 ${i < order.review!.rating ? 'text-yellow-400' : 'text-gray-600'}`} />
                     ))}
                   </div>
                   <p className="text-xs text-gray-300 italic">&quot;{order.review.text}&quot;</p>
                 </div>
               )}
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
