'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useNotification } from '@/context/NotificationContext';
import { Briefcase, MessageSquare, ExternalLink, ShieldCheck, Activity } from 'lucide-react';
import { mockOrders, mockGigs, Order } from '@/lib/mockGigs';
import { ChatModal } from '@/components/ChatModal';
import { DeliverablesModal } from '@/components/DeliverablesModal';
import { StatusModal } from '@/components/StatusModal';
import { Pagination } from '@/components/Pagination';
import { DashboardSearch } from '@/components/DashboardSearch';

const DashboardTabs: React.FC<{ active: string; onTabChange: (v: string) => void }> = ({ active, onTabChange }) => {
  const tabs = ['Active Projects', 'Profile', 'History'];
  return (
    <div className="flex space-x-6 border-b border-white/5 mb-8">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onTabChange(t.toLowerCase().replace(' ', '_'))}
          className={`pb-3 font-heading text-xs font-bold tracking-wide uppercase transition-colors ${
            active === t.toLowerCase().replace(' ', '_')
              ? 'text-neoncyan border-b-2 border-neoncyan'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
};

const ActiveProjectsView: React.FC = () => {
  // Combine orders with gig info for better searching
  const clientOrders = mockOrders
    .filter(o => o.clientAddress === 'GCLIENT...123' || o.clientAddress === 'GCLIENT...456')
    .map(o => ({ ...o, gigInfo: mockGigs.find(g => g.id === o.gigId) }));

  // Search, Filter, Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [activeDeliverablesOrder, setActiveDeliverablesOrder] = useState<Order | null>(null);
  const [activeStatusOrder, setActiveStatusOrder] = useState<Order | null>(null);

  const { showToast } = useNotification();

  const handleApproveDeliverables = (orderId: string) => {
    showToast(`Approving deliverables for order ${orderId} and releasing Escrow funds!`, 'success');
    setActiveDeliverablesOrder(null);
  };

  const handleDenyDeliverables = (orderId: string, reason: string) => {
    showToast(`Denying deliverables for order ${orderId}. Reason: ${reason}`, 'info');
    setActiveDeliverablesOrder(null);
  };

  // Filter Logic
  const filteredOrders = clientOrders.filter(order => {
    const matchesSearch =
      order.freelancerAddress.toLowerCase().includes(search.toLowerCase()) ||
      (order.gigInfo?.freelancerName.toLowerCase() || '').includes(search.toLowerCase()) ||
      (order.gigInfo?.title.toLowerCase() || '').includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Pending Acceptance', value: 'pending_acceptance' },
    { label: 'Escrow Funded', value: 'escrow_funded' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Disputed', value: 'disputed' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-bold text-lg text-white">My Active Bookings</h3>
      </div>

      <DashboardSearch
        value={search}
        onChange={(val) => { setSearch(val); setCurrentPage(1); }}
        placeholder="Search by freelancer or service title..."
        filterValue={statusFilter}
        onFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
        filterOptions={statusOptions}
      />

      {paginatedOrders.length > 0 ? (
        paginatedOrders.map(order => (
          <div key={order.id} className="p-6 rounded-xl glass-card border border-white/5 flex flex-col lg:flex-row justify-between items-start gap-6">

            {/* Order Info */}
            <div className="flex-1 space-y-4 w-full pt-1">
              <div>
                 <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Freelancer</p>
                 <p className="text-sm font-bold text-white flex items-center gap-1">
                   {order.gigInfo?.freelancerName || order.freelancerAddress} <ShieldCheck className="w-3.5 h-3.5 text-neongreen" />
                 </p>
                 <p className="text-xs text-gray-400 mt-1">{order.gigInfo?.title}</p>
              </div>

              <div className="bg-obsidian rounded-lg p-4 border border-white/5 max-w-sm">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Total Budget:</span>
                  <span className="font-bold text-white">${order.priceUSD} USD</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Upfront Released ({order.upfrontPercentage}%):</span>
                  <span className="font-bold text-neongreen">${(order.priceUSD * (order.upfrontPercentage / 100)).toFixed(2)} USD</span>
                </div>
              </div>

              {order.status === 'pending_acceptance' && (
                <p className="text-xs text-yellow-500 italic">Waiting for freelancer to accept request. Escrow funding will unlock upon acceptance.</p>
              )}
            </div>

            {/* Status Badge & Action Buttons Column */}
            <div className="flex flex-col gap-3 w-full lg:w-64">

              {/* Status Badge (Consistent Size) */}
              <div className="mb-1 flex justify-start w-full">
                <span className={`w-full text-center py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider font-heading ${
                  order.status === 'pending_acceptance' ? 'bg-[#1a1400]/80 text-[#eab308] border border-[#eab308]/30 shadow-[0_0_8px_rgba(234,179,8,0.15)]' :
                  order.status === 'escrow_funded' ? 'bg-[#001a1a]/80 text-[#00ffff] border border-[#00ffff]/30 shadow-[0_0_8px_rgba(0,255,255,0.15)]' :
                  order.status === 'delivered' ? 'bg-[#001a00]/80 text-[#39ff14] border border-[#39ff14]/30 shadow-[0_0_8px_rgba(57,255,20,0.15)]' :
                  'bg-white/10 text-white'
                }`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>

              <button
                onClick={() => setActiveChatOrder(order)}
                className="w-full py-2.5 rounded-lg bg-[#141026] border border-white/10 text-white font-heading font-bold text-xs uppercase hover:bg-white/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </button>
              <button
                onClick={() => setActiveDeliverablesOrder(order)}
                className="w-full py-2.5 rounded-lg bg-[#001a1a]/40 border border-[#00ffff]/30 text-[#00ffff] font-heading font-bold text-xs uppercase hover:bg-[#001a1a]/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> View Deliverables
              </button>
              <button
                onClick={() => setActiveStatusOrder(order)}
                className="w-full py-2.5 rounded-lg bg-white text-black font-heading font-bold text-xs uppercase hover:shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Activity className="w-4 h-4" /> View Status
              </button>
            </div>

          </div>
        ))
      ) : (
        <div className="py-12 text-center border border-white/5 rounded-xl glass-card">
          <p className="text-sm text-gray-400">No active bookings found.</p>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Render Modals */}
      {activeChatOrder && (
        <ChatModal
          order={activeChatOrder}
          currentAddress={activeChatOrder.clientAddress}
          onClose={() => setActiveChatOrder(null)}
        />
      )}

      {activeDeliverablesOrder && (
        <DeliverablesModal
          order={activeDeliverablesOrder}
          onClose={() => setActiveDeliverablesOrder(null)}
          onApprove={handleApproveDeliverables}
          onDeny={handleDenyDeliverables}
        />
      )}

      {activeStatusOrder && (
        <StatusModal
          order={activeStatusOrder}
          onClose={() => setActiveStatusOrder(null)}
        />
      )}
    </div>
  );
};

// History View
const HistoryView: React.FC = () => {
  const myCompletedOrders = mockOrders
    .filter(o => o.clientAddress.startsWith('GCLIENT') && o.status === 'completed')
    .map(o => ({ ...o, gigInfo: mockGigs.find(g => g.id === o.gigId) }));

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-bold text-lg text-white">Booking History</h3>
      <div className="space-y-4">
        {myCompletedOrders.length > 0 ? (
          myCompletedOrders.map(order => (
            <div key={order.id} className="p-6 rounded-xl glass-card border border-white/5 flex flex-col gap-4">
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-xs uppercase font-bold tracking-wider text-neongreen mb-1">Completed Order</p>
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

// Profile Settings View
const ProfileSettingsView: React.FC = () => {
  const { userProfile, registerProfile, deleteProfile } = useWallet();
  const { showToast, showConfirm } = useNotification();
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
          <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-neoncyan" />
        </div>
        <div className="flex justify-between pt-4 mt-4 border-t border-white/5">
          <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-500/10 text-red-400 font-bold text-sm rounded hover:bg-red-500/20 transition-colors">
            Delete Account
          </button>
          <button type="submit" className="px-6 py-2 bg-neoncyan text-obsidian font-bold text-sm rounded hover:shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default function ClientDashboard() {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('active_projects');

  return (
    <div className="min-h-screen bg-obsidian text-white py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-left border-b border-white/5 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white flex items-center space-x-2">
          <Briefcase className="w-5 h-5 text-neoncyan text-glow-cyan" />
          <span>Client Dashboard</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {isConnected
            ? 'Track your active bookings, fund escrows, and communicate with freelancers.'
            : 'Dev Sandbox: Showing mockup state. Connect wallet to sync.'}
        </p>
      </div>

      <div className="mt-8">
        <DashboardTabs active={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'active_projects' && <ActiveProjectsView />}
        {activeTab === 'profile' && <ProfileSettingsView />}
        {activeTab === 'history' && <HistoryView />}
      </div>
    </div>
  );
}
