'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { Order } from '@/lib/types';
import { getFreelancerOrders } from '@/lib/db';
import { getFreelancerReputation } from '@/lib/contract';
import { UserWalletInfo } from '@/components/ui/UserWalletInfo';

type HistoryItem = Order & { isRestored?: boolean; restoredDate?: Date };

export const HistoryView: React.FC = () => {
  const { address } = useWallet();
  const [completedOrders, setCompletedOrders] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(!!address);

  useEffect(() => {
    if (!address) return;

    Promise.all([
      getFreelancerOrders(address).catch(e => {
        console.error('Failed to fetch Firestore orders:', e);
        return [] as Order[];
      }),
      getFreelancerReputation(address).catch(e => {
        console.error('Failed to fetch on-chain reputation:', e);
        return null;
      })
    ]).then(([orders, reputation]) => {
      const dbCompleted = orders.filter(
        o => o.status === 'completed' || o.status === 'denied' || o.status === 'settled_dispute'
      );
      
      const merged: HistoryItem[] = [...dbCompleted];

      if (reputation?.reviews) {
        reputation.reviews.forEach((review, idx) => {
          // Deduplicate: check if this review already exists in db completed orders
          const exists = dbCompleted.some(
            o => o.clientAddress === review.client && o.review?.text === review.text && o.review?.rating === review.rating
          );

          if (!exists) {
            const restoredDate = new Date(review.timestamp * 1000);
            merged.push({
              id: `restored-${idx}-${review.timestamp}`,
              gigId: 'restored',
              clientAddress: review.client,
              clientName: 'Restored from Ledger',
              freelancerAddress: address,
              status: 'completed',
              priceUSD: 0,
              progressPercentage: 100,
              changelogs: [],
              chatMessages: [],
              review: { rating: review.rating, text: review.text },
              isRestored: true,
              restoredDate
            });
          }
        });
      }
      
      // Sort newest first by using id/timestamp if available, but for now we append
      setCompletedOrders(merged);
      setIsLoading(false);
    });
  }, [address]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
         <h3 className="font-heading font-bold text-lg text-white">Transaction History</h3>
         <div className="py-12 text-center border border-white/5 rounded-xl glass-card">
           <p className="text-sm text-gray-400">Syncing ledger...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-bold text-lg text-white">Transaction History</h3>
      <div className="space-y-4">
        {completedOrders.length > 0 ? (
          completedOrders.map(order => (
            <div key={order.id} className={`p-6 rounded-xl glass-card flex flex-col gap-4 transition-all duration-200 ${
              order.isRestored ? 'border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)] bg-green-500/5' : 'border border-white/5'
            }`}>
               <div className="flex justify-between items-start">
                 <div>
                   <div className="flex items-center gap-2 mb-1">
                     <p className={`text-xs uppercase font-bold tracking-wider ${
                       order.isRestored ? 'text-green-400' :
                       order.status === 'completed' ? 'text-green-400' : 
                       order.status === 'settled_dispute' ? 'text-yellow-500' : 'text-red-400'
                     }`}>
                       {order.isRestored ? 'Verified On-Chain' :
                        order.status === 'completed' ? 'Completed Order' : 
                        order.status === 'settled_dispute' ? 'Settled Dispute' : 'Cancelled Order'}
                     </p>
                     {order.isRestored && <ShieldCheck className="w-3.5 h-3.5 text-green-400" />}
                   </div>
                   <UserWalletInfo
                     address={order.clientAddress}
                     role="client"
                     fallbackName={order.clientName}
                     className="mb-1"
                   />
                   {!order.isRestored && <p className="text-xs text-gray-400 mt-1">Total: ${order.priceUSD} USD</p>}
                   {order.isRestored && order.restoredDate && (
                     <p className="text-xs text-green-500/70 mt-1">Restored from Ledger • {order.restoredDate.toLocaleDateString()}</p>
                   )}
                 </div>
                 <div className="text-right">
                   {order.txHash && !order.isRestored && (
                     <p className="text-[10px] text-gray-500 font-mono mt-1">Tx: {order.txHash.slice(0, 16)}...</p>
                   )}
                 </div>
               </div>
               
               {order.review && (
                 <div className={`p-3 rounded-lg border ${order.isRestored ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/5'}`}>
                   <div className="flex items-center gap-1 mb-1">
                     {[...Array(5)].map((_, i) => (
                       <Sparkles key={i} className={`w-3 h-3 ${i < order.review!.rating ? 'text-yellow-400' : 'text-gray-600'}`} />
                     ))}
                   </div>
                   <p className={`text-xs italic ${order.isRestored ? 'text-green-100' : 'text-gray-300'}`}>&quot;{order.review.text}&quot;</p>
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
