import React from 'react';
import { FreelancerProfile } from '@/lib/mockGigs';
import { X, Star, CheckCircle, ShieldCheck } from 'lucide-react';

interface ProfileModalProps {
  profile: FreelancerProfile;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-violet-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header Background */}
        <div className="h-24 bg-gradient-to-r from-hotpink/20 to-neoncyan/20 border-b border-white/5 relative">
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
                <span>{profile.averageRating} Rating</span>
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Based on reviews</p>
            </div>
          </div>

          <p className="text-sm text-gray-300 font-medium mb-2">{profile.title}</p>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">{profile.bio}</p>

          {/* On-Chain Stats Grid */}
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-3">On-Chain Reputation</h3>
          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-obsidian border border-white/5 p-4 rounded-xl">
               <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Projects Completed</p>
               <p className="text-xl font-bold text-white font-heading flex items-center gap-2">
                 <CheckCircle className="w-4 h-4 text-neongreen" />
                 {profile.projectsCompleted}
               </p>
             </div>
             <div className="bg-obsidian border border-white/5 p-4 rounded-xl">
               <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Earned</p>
               <p className="text-xl font-bold text-neongreen text-glow-green font-heading">
                 {profile.totalEarnedXLM.toLocaleString()} XLM
               </p>
             </div>
          </div>

          {/* Testimonials */}
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-3">Recent Client Reviews</h3>
          <div className="space-y-3">
            {profile.testimonials.length > 0 ? (
              profile.testimonials.map(t => (
                <div key={t.id} className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-white">{t.clientName}</span>
                    <div className="flex items-center space-x-0.5 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(t.rating) ? 'fill-current' : 'opacity-30'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 italic">&quot;{t.text}&quot;</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic">No reviews yet.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
