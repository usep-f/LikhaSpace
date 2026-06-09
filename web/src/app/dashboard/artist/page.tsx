'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Sparkles, PlusCircle, Check, X, Eye } from 'lucide-react';
import { mockGigs, mockOrders } from '@/lib/mockGigs';
import { Pagination } from '@/components/Pagination';
import { DashboardSearch } from '@/components/DashboardSearch';

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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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
    { label: 'Occupied (Hidden)', value: 'occupied' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-bold text-lg text-white">My Services</h3>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded bg-hotpink text-white font-heading text-[10px] font-bold border border-hotpink/30 hover:shadow-[0_0_8px_rgba(255,0,127,0.3)] transition-all cursor-pointer">
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
                     gig.status === 'active' ? 'bg-neongreen/10 text-neongreen' : 'bg-white/10 text-white'
                   }`}>
                     {gig.status === 'active' ? 'Live' : 'Occupied (Hidden)'}
                   </span>
                 </div>
                 <p className="font-bold text-white text-sm leading-tight pr-4">{gig.title}</p>
                 <p className="text-xs text-hotpink font-bold mt-1">${gig.priceUSD} USD</p>
               </div>
               <div className="flex gap-2">
                 <button className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0">Edit</button>
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
                         onClick={() => alert(`Showing Proposal Modal for order: ${order.id}`)}
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
        {activeTab === 'profile' && <p className="text-sm text-gray-400">Profile management coming soon.</p>}
        {activeTab === 'history' && <p className="text-sm text-gray-400">Completed projects history coming soon.</p>}
      </div>
    </div>
  );
}
