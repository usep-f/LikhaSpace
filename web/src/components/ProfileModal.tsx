import React, { useState, useEffect } from 'react';
import { FreelancerProfile, Order } from '@/lib/types';
import { X, Star, CheckCircle, ShieldCheck, ExternalLink, Link } from 'lucide-react';
import { getFreelancerOrders } from '@/lib/db';
import { getFreelancerReputation, ReputationData } from '@/lib/contract';

interface ProfileModalProps {
  profile: FreelancerProfile;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onClose }) => {
  const [completedOrdersWithReviews, setCompletedOrdersWithReviews] = useState<Order[]>([]);
  const [onChainReputation, setOnChainReputation] = useState<ReputationData | null>(null);
  const [isLoadingRep, setIsLoadingRep] = useState(profile.role !== 'client');

  useEffect(() => {
    if (profile.role === 'client') {
      return;
    }

    // Fetch mock orders for legacy display
    getFreelancerOrders(profile.address)
      .then((orders) => {
        const withReviews = orders.filter(o => o.status === 'completed' && o.review);
        setCompletedOrdersWithReviews(withReviews);
      })
      .catch(console.error);

    // Fetch true on-chain reputation stats
    getFreelancerReputation(profile.address)
      .then((rep) => {
        setOnChainReputation(rep);
      })
      .catch(console.error)
      .finally(() => setIsLoadingRep(false));
  }, [profile.address, profile.role]);

  const offChainReviews = [
    ...(profile.testimonials || []).map(t => ({ 
      id: t.id, 
      clientAddress: undefined,
      clientName: t.clientName, 
      rating: t.rating, 
      text: t.text, 
      txHash: undefined, 
      onChain: false 
    })),
    ...completedOrdersWithReviews.map(o => ({
      id: o.id,
      clientAddress: o.clientAddress,
      clientName: o.clientName,
      rating: o.review!.rating,
      text: o.review!.text,
      txHash: o.txHash,
      onChain: false
    }))
  ];

  const allReviews = [...offChainReviews];

  (onChainReputation?.reviews || []).forEach((onChainReview, i) => {
    // See if we have an off-chain review that matches
    const existingIndex = allReviews.findIndex(r => 
      r.clientAddress === onChainReview.client && 
      r.rating === onChainReview.rating && 
      r.text === onChainReview.text
    );

    if (existingIndex !== -1) {
      // Merge them: Keep off-chain details (like the real client name), but mark as onChain
      allReviews[existingIndex].onChain = true;
    } else {
      // Purely on-chain review not found in off-chain database
      allReviews.push({
        id: `chain-${i}`,
        clientAddress: onChainReview.client,
        clientName: `${onChainReview.client.slice(0, 4)}...${onChainReview.client.slice(-4)}`,
        rating: onChainReview.rating,
        text: onChainReview.text,
        txHash: undefined,
        onChain: true
      });
    }
  });

  const projectsCompleted = onChainReputation ? onChainReputation.projectsCompleted : profile.projectsCompleted;
  const totalEarnedXLM = onChainReputation ? Number(onChainReputation.totalEarnedStroops) / 10000000 : profile.totalEarnedXLM;
  const hasReviews = allReviews.length > 0;
  const averageRating = hasReviews
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-violet-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header Background */}
        <div className="h-24 bg-linear-to-r from-hotpink/20 to-neoncyan/20 border-b border-white/5 relative">
           <button
             onClick={onClose}
             className="absolute top-4 right-4 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-8 relative">

          {/* Avatar & Basic Info */}
          <div className="flex justify-between items-end -mt-10 mb-6">
            <div className="flex items-end space-x-4">
              <div className="w-20 h-20 rounded-xl bg-obsidian border-2 border-hotpink flex items-center justify-center shadow-[0_0_15px_rgba(255,0,127,0.3)]">
                <span className="text-3xl font-heading font-bold text-white">
                  {profile.name.charAt(0)}
                </span>
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                  {profile.name}
                  <ShieldCheck className="w-4 h-4 text-neoncyan" aria-label="On-Chain Verified" />
                </h2>
                <p className="text-xs text-hotpink font-mono">{profile.address}</p>
              </div>
            </div>

            <div className="pb-1 text-right">
              <div className="flex items-center justify-end space-x-1 text-yellow-400 font-bold text-sm">
                <Star className="w-4 h-4 fill-current" />
                <span>{averageRating !== null ? `${averageRating} Rating` : 'No Reviews'}</span>
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Based on reviews</p>
            </div>
          </div>

          <p className="text-sm text-gray-300 font-medium mb-2">{profile.title}</p>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">{profile.bio}</p>

          {/* Social Links */}
          {(profile.github || profile.linkedin || profile.twitter || profile.portfolio) && (
            <div className="flex items-center space-x-3 mb-6">
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"><title>LinkedIn</title><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              )}
              {profile.twitter && (
                <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"><title>X</title><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                </a>
              )}
              {profile.portfolio && (
                <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <Link className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {profile.role !== 'client' && (
            <>
              {/* On-Chain Stats Grid */}
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-3 flex items-center gap-2">
            On-Chain Reputation
            {isLoadingRep && <span className="text-neoncyan animate-pulse">Loading...</span>}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-obsidian border border-white/5 p-4 rounded-xl relative overflow-hidden">
               {onChainReputation && <div className="absolute top-0 right-0 p-1 bg-neoncyan/10 rounded-bl-lg"><ShieldCheck className="w-3 h-3 text-neoncyan" /></div>}
               <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Projects Completed</p>
               <p className="text-xl font-bold text-white font-heading flex items-center gap-2">
                 <CheckCircle className="w-4 h-4 text-neongreen" />
                 {projectsCompleted}
               </p>
             </div>
             <div className="bg-obsidian border border-white/5 p-4 rounded-xl relative overflow-hidden">
               {onChainReputation && <div className="absolute top-0 right-0 p-1 bg-neoncyan/10 rounded-bl-lg"><ShieldCheck className="w-3 h-3 text-neoncyan" /></div>}
               <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Earned</p>
               <p className="text-xl font-bold text-neongreen text-glow-green font-heading">
                 {totalEarnedXLM.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM
               </p>
             </div>
          </div>

          {/* Testimonials */}
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-3">Verified Client Reviews</h3>
          <div className="space-y-3">
            {allReviews.length > 0 ? (
              allReviews.map(t => (
                <div key={t.id} className="bg-white/5 p-4 rounded-xl border border-white/5 relative">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      {t.clientName}
                      {(t.txHash || t.onChain) && (
                        <span className="flex items-center text-[9px] text-neongreen bg-neongreen/10 px-1.5 py-0.5 rounded gap-0.5 ml-2" title={t.txHash ? `Verified Tx: ${t.txHash}` : 'Verified On-Chain'}>
                          <ShieldCheck className="w-2.5 h-2.5" />
                          On-Chain
                        </span>
                      )}
                    </span>
                    <div className="flex items-center space-x-0.5 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(t.rating) ? 'fill-current' : 'opacity-30'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 italic mb-2">&quot;{t.text}&quot;</p>
                  
                  {t.txHash && (
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${t.txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[10px] text-gray-500 hover:text-neoncyan transition-colors mt-2 font-mono gap-1"
                    >
                      Tx: {t.txHash.slice(0, 16)}... <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic">No reviews yet.</p>
            )}
          </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
