import React from 'react';
import { FreelancerProfile, Order } from '@/lib/types';
import { 
  Mail, Phone, Briefcase, Star, Clock, CheckCircle2, Pencil
} from 'lucide-react';
import { ProfileSettingsModal } from './ProfileSettingsModal';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

export interface OverviewViewProps {
  profile: FreelancerProfile | null;
  totalEarned: number;
  completed: number;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ profile, totalEarned, completed }) => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isEditProfileOpen, setIsEditProfileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!profile?.address) return;
    import('@/lib/db').then(({ subscribeToFreelancerOrders }) => {
      const unsubscribe = subscribeToFreelancerOrders(profile.address, (data) => {
        setOrders(data);
      });
      return () => unsubscribe();
    });
  }, [profile?.address]);
  // Mock data fallbacks if not available
  const displayProfile = {
    name: profile?.name || 'Anonymous Freelancer',
    bio: profile?.bio || 'No bio provided.',
    email: profile?.email || 'contact@example.com',
    phone: profile?.phone || '+1 (555) 123-4567',
    github: profile?.github || 'github.com/freelancer',
    linkedin: profile?.linkedin || 'linkedin.com/in/freelancer',
    twitter: profile?.twitter || '@freelancer',
  };

  // Derive active projects
  const activeProjects = orders.filter(o => 
    !['completed', 'delivered', 'denied'].includes(o.status)
  ).slice(0, 3); // Take top 3 for the list



  // Derive rating metric data (mocking the last 5 projects if no real data)
  const completedOrdersWithReviews = orders
    .filter(o => o.status === 'completed' && o.review)
    .slice(-5);
  
  const ratingData = completedOrdersWithReviews.length > 0 
    ? completedOrdersWithReviews.map((o, i) => ({
        name: `Proj ${i + 1}`,
        rating: o.review?.rating || 0
      }))
    : [
        { name: 'Proj 1', rating: 5 },
        { name: 'Proj 2', rating: 4 },
        { name: 'Proj 3', rating: 5 },
        { name: 'Proj 4', rating: 4.5 },
        { name: 'Proj 5', rating: 5 },
      ];

  const initials = displayProfile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
      
      {/* Left Column (Profile) */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-obsidian border border-white/10 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-hotpink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-hotpink flex items-center justify-center shadow-[0_0_15px_rgba(255,105,180,0.5)]">
                <span className="text-3xl font-heading font-bold text-gray-400 tracking-widest">{initials}</span>
              </div>
              <button 
                onClick={() => setIsEditProfileOpen(true)}
                className="absolute bottom-0 right-0 p-2 bg-hotpink text-white rounded-full hover:bg-pink-600 transition-colors shadow-lg cursor-pointer"
                title="Edit Profile"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            
            <div>
              <h2 className="text-xl font-heading font-bold text-white text-glow-pink">{displayProfile.name}</h2>
              <p className="text-sm text-gray-400 mt-2 line-clamp-3">{displayProfile.bio}</p>
            </div>
            
            <div className="w-full space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <Mail className="w-4 h-4 text-hotpink" />
                <span>{displayProfile.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <Phone className="w-4 h-4 text-hotpink" />
                <span>{displayProfile.phone}</span>
              </div>
            </div>

            <div className="w-full flex justify-center space-x-4 pt-4 border-t border-white/10">
              <a href={`https://${displayProfile.github}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-gray-400">
                <GithubIcon className="w-4 h-4" />
              </a>
              <a href={`https://${displayProfile.linkedin}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-gray-400">
                <LinkedinIcon className="w-4 h-4" />
              </a>
              <a href={`https://${displayProfile.twitter}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-gray-400">
                <TwitterIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Right/Main Column */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-obsidian border border-white/10 rounded-xl p-6 flex flex-col justify-center hover:border-hotpink/50 transition-colors">
            <h3 className="text-sm font-heading font-bold text-gray-400 uppercase tracking-wider mb-2">Total XLM Earned</h3>
            <div className="text-4xl font-bold text-white flex items-baseline space-x-2">
              <span className="text-glow-green text-neongreen">{totalEarned.toLocaleString()}</span>
              <span className="text-lg text-gray-500">XLM</span>
            </div>
          </div>
          
          <div className="bg-obsidian border border-white/10 rounded-xl p-6 flex flex-col justify-center hover:border-hotpink/50 transition-colors">
            <h3 className="text-sm font-heading font-bold text-gray-400 uppercase tracking-wider mb-2">Gigs Completed</h3>
            <div className="text-4xl font-bold text-white flex items-baseline space-x-2">
              <span className="text-glow-pink text-hotpink">{completed}</span>
              <span className="text-lg text-gray-500">Projects</span>
            </div>
          </div>
        </div>

        {/* Bottom Split: Active Projects List & Rating Metric */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Active Projects List */}
          <div className="bg-obsidian border border-white/10 rounded-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-hotpink" />
                Active Projects
              </h3>
            </div>
            
            <div className="flex-1 space-y-3">
              {activeProjects.length > 0 ? (
                activeProjects.map((proj) => (
                  <div key={proj.id} className="flex items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-hotpink/30 transition-colors">
                    <div className="mr-4 text-hotpink">
                      {proj.status === 'escrow_funded' ? (
                        <Clock className="w-5 h-5 animate-pulse" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{proj.gigId || 'Custom Project'}</p>
                      <p className="text-xs text-gray-400 truncate">{proj.clientName || 'Client'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
                  <Briefcase className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">No active projects</p>
                </div>
              )}
            </div>
          </div>

          {/* Rating Metric Graph */}
          <div className="bg-obsidian border border-white/10 rounded-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider flex items-center">
                <Star className="w-4 h-4 mr-2 text-neoncyan" />
                Rating Metric
              </h3>
            </div>
            
            <div className="flex-1 min-h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff40" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#ffffff40" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#ffffff20', borderRadius: '8px' }}
                    itemStyle={{ color: '#00F0FF' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rating" 
                    stroke="#00F0FF" 
                    strokeWidth={3}
                    dot={{ fill: '#0F172A', stroke: '#00F0FF', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#00F0FF' }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {isEditProfileOpen && (
        <ProfileSettingsModal onClose={() => setIsEditProfileOpen(false)} />
      )}
    </div>
  );
};
