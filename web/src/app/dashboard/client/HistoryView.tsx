'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useNotification } from '@/context/NotificationContext';
import { ShieldCheck } from 'lucide-react';
import { Order, Gig, FreelancerProfile } from '@/lib/types';
import { getClientOrders, getGig, getUserProfile } from '@/lib/db';
import { UserWalletInfo } from '@/components/ui/UserWalletInfo';
import { ProfileModal } from '@/components/ProfileModal';

export const HistoryView: React.FC = () => {
  const { uid, address } = useWallet();
  const { showToast, showLoading, hideLoading } = useNotification();
  const [completedOrders, setCompletedOrders] = useState<(Order & { gigInfo?: Gig })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFreelancerProfile, setActiveFreelancerProfile] = useState<FreelancerProfile | null>(null);

  const handleViewFreelancerProfile = async (freelancerAddress: string) => {
    showLoading('Loading freelancer profile...');
    try {
      const p = await getUserProfile(freelancerAddress);
      if (p) {
        setActiveFreelancerProfile({
          address: freelancerAddress,
          name: p.name || 'Freelancer',
          title: p.title || '',
          bio: p.bio || '',
          totalEarnedXLM: p.totalEarnedXLM || 0,
          projectsCompleted: p.projectsCompleted || 0,
          averageRating: p.averageRating || 5.0,
          testimonials: p.testimonials || [],
          role: 'freelancer',
          github: p.github,
          linkedin: p.linkedin,
          twitter: p.twitter,
          portfolio: p.portfolio,
        });
      } else {
        showToast('Freelancer profile not found', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading profile', 'error');
    } finally {
      hideLoading();
    }
  };

  React.useEffect(() => {
    const fetchId = address || uid;
    if (!fetchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    getClientOrders(fetchId)
      .then(async (orders) => {
        const completed = orders.filter(o => o.status === 'completed' || o.status === 'denied' || o.status === 'settled_dispute');
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
  }, [address, uid]);

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
                       order.status === 'completed' ? 'text-neongreen' : 
                       order.status === 'settled_dispute' ? 'text-yellow-500' : 'text-red-400'
                     }`}>
                       {order.status === 'completed' ? 'Completed Order' : 
                        order.status === 'settled_dispute' ? 'Settled Dispute' : 'Cancelled Order'}
                     </p>
                    <div className="flex items-center gap-1 mb-1">
                      <div 
                        role="button"
                        tabIndex={0}
                        onClick={() => handleViewFreelancerProfile(order.freelancerAddress)}
                        onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleViewFreelancerProfile(order.freelancerAddress) }}
                        className="text-left hover:opacity-80 transition-opacity block cursor-pointer"
                        title="View Freelancer Profile"
                      >
                        <UserWalletInfo
                          address={order.freelancerAddress}
                          role="freelancer"
                          fallbackName={order.gigInfo?.freelancerName}
                        />
                      </div>
                      <ShieldCheck className="w-3.5 h-3.5 text-neongreen" />
                    </div>
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

      {activeFreelancerProfile && (
        <ProfileModal
          profile={activeFreelancerProfile}
          onClose={() => setActiveFreelancerProfile(null)}
        />
      )}
    </div>
  );
};
