'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useNotification } from '@/context/NotificationContext';
import { Sparkles, PlusCircle, Check, X, Eye } from 'lucide-react';
import { mockGigs, mockOrders, Order, Gig } from '@/lib/mockGigs';
import { Pagination } from '@/components/Pagination';
import { DashboardSearch } from '@/components/DashboardSearch';
import { ProposalModal } from '@/components/ProposalModal';
import { ListingModal } from '@/components/ListingModal';

// Sub-component: Stats
const ReputationStatCard: React.FC<{ label: string; value: string; colorClass: string }> = ({ label, value, colorClass }) => (
  <div className="p-4 rounded-xl glass-card border border-white/5">
    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">{label}</p>
    <p className={`text-xl font-bold font-heading mt-1 ${colorClass}`}>{value}</p>
  </div>
);

// Tabs Navigation
const DashboardTabs: React.FC<{ active: string; onTabChange: (v: string) => void }> = ({ active, onTabChange }) => {
  const tabs = ['Listings', 'Orders', 'Profile', 'History'];
  return (
    <div className="flex space-x-6 border-b border-white/5 mb-8">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onTabChange(t.toLowerCase())}
          className={`pb-3 font-heading text-xs font-bold tracking-wide uppercase transition-colors ${
            active === t.toLowerCase()
              ? 'text-hotpink border-b-2 border-hotpink'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
};

// Listings View
const ListingsView: React.FC = () => {
  const allMyGigs = mockGigs.filter(g => g.freelancerAddress === 'GDX7...R39P');
  const { showToast } = useNotification();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Listing Modal State
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);

  const filteredGigs = allMyGigs.filter(gig => {
    const matchesSearch = gig.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || gig.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredGigs.length / itemsPerPage);
  const paginatedGigs = filteredGigs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusOptions = [
    { label: 'All Listings', value: 'all' },
    { label: 'Live (Available)', value: 'active' },
    { label: 'Occupied (Hidden)', value: 'occupied' },
    { label: 'Paused (Hidden)', value: 'paused' }
  ];

  const handleCreateNew = () => {
    setEditingGig(null);
    setIsListingModalOpen(true);
  };

  const handleEdit = (gig: Gig) => {
    setEditingGig(gig);
    setIsListingModalOpen(true);
  };

  const handleSaveListing = (updatedGig: Partial<Gig>) => {
    console.log('Saved listing data:', updatedGig);
    showToast('Listing saved successfully! (Mock Action)', 'success');
    setIsListingModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-bold text-lg text-white">My Services</h3>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-hotpink text-white font-heading text-[10px] font-bold border border-hotpink/30 hover:shadow-[0_0_8px_rgba(255,0,127,0.3)] transition-all cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Create Listing
        </button>
      </div>

      <DashboardSearch
        value={search}
        onChange={(val) => { setSearch(val); setCurrentPage(1); }}
        placeholder="Search my listings..."
        filterValue={statusFilter}
        onFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
        filterOptions={statusOptions}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedGigs.length > 0 ? (
          paginatedGigs.map(gig => (
            <div key={gig.id} className="p-5 rounded-xl glass-card border border-white/5 flex justify-between items-start">
               <div>
                 <div className="flex items-center gap-2 mb-2">
                   <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                     gig.status === 'active' ? 'bg-neongreen/10 text-neongreen' :
                     gig.status === 'paused' ? 'bg-gray-500/10 text-gray-400' : 'bg-white/10 text-white'
                   }`}>
                     {gig.status === 'active' ? 'Live' : gig.status === 'paused' ? 'Paused' : 'Occupied (Hidden)'}
                   </span>
                 </div>
                 <p className="font-bold text-white text-sm leading-tight pr-4">{gig.title}</p>
                 <p className="text-xs text-hotpink font-bold mt-1">${gig.priceUSD} USD</p>
               </div>
               <div className="flex gap-2">
                 <button
                   onClick={() => handleEdit(gig)}
                   className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                 >
                   Edit
                 </button>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border border-white/5 rounded-xl glass-card">
            <p className="text-sm text-gray-400">No listings found.</p>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {isListingModalOpen && (
        <ListingModal
          gig={editingGig}
          onClose={() => setIsListingModalOpen(false)}
          onSave={handleSaveListing}
        />
      )}
    </div>
  );
};

// Orders View
const OrdersView: React.FC = () => {
  const myOrders = mockOrders.filter(o => o.freelancerAddress === 'GDX7...R39P');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Active decline interaction state mapping (orderId -> boolean)
  const [showDenyInput, setShowDenyInput] = useState<Record<string, boolean>>({});
  const [denyMsgs, setDenyMsgs] = useState<Record<string, string>>({});

  // Modal State
  const [activeProposalOrder, setActiveProposalOrder] = useState<Order | null>(null);

  const filteredOrders = myOrders.filter(order => {
    const matchesSearch = order.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusOptions = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending Acceptance', value: 'pending_acceptance' },
    { label: 'Escrow Funded (Active)', value: 'escrow_funded' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Completed', value: 'completed' }
  ];

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-bold text-lg text-white">Active Requests & Orders</h3>

      <DashboardSearch
        value={search}
        onChange={(val) => { setSearch(val); setCurrentPage(1); }}
        placeholder="Search by client name..."
        filterValue={statusFilter}
        onFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
        filterOptions={statusOptions}
      />

      <div className="space-y-4">
        {paginatedOrders.length > 0 ? (
          paginatedOrders.map(order => (
            <div key={order.id} className={`p-6 rounded-xl glass-card border flex flex-col md:flex-row justify-between items-center gap-6 ${
              order.status === 'pending_acceptance' ? 'border-neoncyan/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'border-white/5'
            }`}>
               <div className="flex-1 w-full">
                 <div className="flex items-center gap-3 mb-1">
                   <p className={`text-[10px] uppercase font-bold tracking-wider ${
                     order.status === 'pending_acceptance' ? 'text-neoncyan' : 'text-gray-400'
                   }`}>
                     {order.status === 'pending_acceptance' ? 'New Request' : 'Active Order'}
                   </p>
                   <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[9px] uppercase tracking-wider font-bold">
                     {order.status.replace('_', ' ')}
                   </span>
                 </div>
                 <p className="text-sm font-bold text-white">Client: {order.clientName}</p>
                 <p className="text-xs text-gray-400 mt-1">Total: ${order.priceUSD} • Upfront: {order.upfrontPercentage}%</p>
               </div>

               <div className="flex-1 w-full flex justify-end">
                 {order.status === 'pending_acceptance' ? (
                   !showDenyInput[order.id] ? (
                     <div className="flex gap-2 flex-wrap justify-end">
                       <button
                         onClick={() => setActiveProposalOrder(order)}
                         className="px-4 py-2 rounded bg-neoncyan/10 border border-neoncyan/30 text-neoncyan font-heading font-bold text-xs uppercase hover:bg-neoncyan/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
                       >
                         <Eye className="w-4 h-4" /> View Proposal
                       </button>
                       <button className="px-4 py-2 rounded bg-neongreen text-obsidian font-heading font-bold text-xs uppercase hover:shadow-[0_0_10px_rgba(57,255,20,0.4)] transition-all flex items-center justify-center gap-1 cursor-pointer">
                         <Check className="w-4 h-4" /> Accept
                       </button>
                       <button
                         onClick={() => setShowDenyInput({ ...showDenyInput, [order.id]: true })}
                         className="px-4 py-2 rounded bg-white/5 text-white font-heading font-bold text-xs uppercase hover:bg-white/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                       >
                         <X className="w-4 h-4" /> Deny
                       </button>
                     </div>
                   ) : (
                     <div className="w-full space-y-2">
                       <textarea
                         value={denyMsgs[order.id] || ''}
                         onChange={(e) => setDenyMsgs({ ...denyMsgs, [order.id]: e.target.value })}
                         placeholder="Reason for declining (Optional)..."
                         className="w-full bg-obsidian border border-white/10 rounded-lg p-2 text-xs text-white resize-none h-16"
                       />
                       <div className="flex justify-end gap-2">
                         <button onClick={() => setShowDenyInput({ ...showDenyInput, [order.id]: false })} className="px-3 py-1.5 rounded text-gray-400 text-xs hover:text-white cursor-pointer">Cancel</button>
                         <button className="px-3 py-1.5 rounded bg-hotpink text-white font-bold text-xs cursor-pointer">Confirm Decline</button>
                       </div>
                     </div>
                   )
                 ) : (
                   <div className="flex gap-2">
                     <button className="px-4 py-2 rounded bg-white/5 border border-white/10 text-white font-heading font-bold text-xs uppercase hover:bg-white/10 transition-colors cursor-pointer">
                       Open Workspace
                     </button>
                   </div>
                 )}
               </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center border border-white/5 rounded-xl glass-card">
            <p className="text-sm text-gray-400">No active requests or orders found.</p>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {activeProposalOrder && (
        <ProposalModal
          order={activeProposalOrder}
          onClose={() => setActiveProposalOrder(null)}
        />
      )}
    </div>
  );
};

// History View
const HistoryView: React.FC = () => {
  const myCompletedOrders = mockOrders.filter(o => o.freelancerAddress === 'GDX7...R39P' && o.status === 'completed');

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-bold text-lg text-white">Transaction History</h3>
      <div className="space-y-4">
        {myCompletedOrders.length > 0 ? (
          myCompletedOrders.map(order => (
            <div key={order.id} className="p-6 rounded-xl glass-card border border-white/5 flex flex-col gap-4">
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-xs uppercase font-bold tracking-wider text-green-400 mb-1">Completed Order</p>
                   <p className="text-sm font-bold text-white">Client: {order.clientName}</p>
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

// Profile Settings View
const ProfileSettingsView: React.FC = () => {
  const { userProfile, registerProfile, deleteProfile } = useWallet();
  const { showToast, showConfirm } = useNotification();
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    title: userProfile?.title || '',
    bio: userProfile?.bio || '',
    category: userProfile?.category || '',
    careerPath: userProfile?.careerPath || '',
    github: userProfile?.github || '',
    linkedin: userProfile?.linkedin || '',
    twitter: userProfile?.twitter || '',
    portfolio: userProfile?.portfolio || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    void registerProfile(formData);
    showToast('Profile updated successfully!', 'success');
  };

  const handleDelete = () => {
    showConfirm(
      'Delete Account',
      'Are you sure you want to completely delete your account? Your personal data will be erased, but your on-chain transactions will remain safely recorded on the Stellar network under your wallet address.',
      async () => {
        await deleteProfile();
        window.location.href = '/';
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h3 className="font-heading font-bold text-lg text-white">Profile Settings</h3>
      <form onSubmit={handleSave} className="space-y-4 p-6 glass-card rounded-xl border border-white/5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
          <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Professional Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
          <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink" />
        </div>
        <div className="flex justify-between pt-4 mt-4 border-t border-white/5">
          <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-500/10 text-red-400 font-bold text-sm rounded hover:bg-red-500/20 transition-colors">
            Delete Account
          </button>
          <button type="submit" className="px-6 py-2 bg-hotpink text-white font-bold text-sm rounded hover:bg-pink-600 transition-colors">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default function ArtistDashboard() {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('listings');

  return (
    <div className="min-h-screen bg-obsidian text-white py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-left border-b border-white/5 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-hotpink text-glow-pink" />
          <span>Freelancer Dashboard</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {isConnected 
            ? 'Manage your services, accept requests, and track active escrow contracts.'
            : 'Dev Sandbox: Showing mockup state. Connect wallet to sync.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ReputationStatCard label="Total XLM Earned" value="12,500 XLM" colorClass="text-glow-green text-neongreen" />
        <ReputationStatCard label="Gigs Completed" value="24 Projects" colorClass="text-glow-pink text-hotpink" />
        <ReputationStatCard label="On-Chain Reputation" value="4.9 Rating" colorClass="text-glow-cyan text-neoncyan" />
      </div>

      <div className="mt-8">
        <DashboardTabs active={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'listings' && <ListingsView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'profile' && <ProfileSettingsView />}
        {activeTab === 'history' && <HistoryView />}
      </div>
    </div>
  );
}
