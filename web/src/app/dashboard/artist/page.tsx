'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Sparkles, PlusCircle, Check, X } from 'lucide-react';
import { mockGigs, mockOrders, Gig, Order } from '@/lib/mockGigs';

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
  // Assuming logged-in freelancer is GDX7...R39P (Karla)
  const myGigs = mockGigs.filter(g => g.freelancerAddress === 'GDX7...R39P');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-bold text-lg text-white">My Services</h3>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded bg-hotpink text-white font-heading text-[10px] font-bold border border-hotpink/30 hover:shadow-[0_0_8px_rgba(255,0,127,0.3)] transition-all cursor-pointer">
          <PlusCircle className="w-3.5 h-3.5" />
          Create Listing
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myGigs.map(gig => (
          <div key={gig.id} className="p-5 rounded-xl glass-card border border-white/5 flex justify-between items-start">
             <div>
               <div className="flex items-center gap-2 mb-2">
                 <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                   gig.status === 'active' ? 'bg-neongreen/10 text-neongreen' : 'bg-white/10 text-white'
                 }`}>
                   {gig.status === 'active' ? 'Live' : 'Occupied (Hidden)'}
                 </span>
               </div>
               <p className="font-bold text-white text-sm leading-tight">{gig.title}</p>
               <p className="text-xs text-hotpink font-bold mt-1">${gig.priceUSD} USD</p>
             </div>
             <div className="flex gap-2">
               <button className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer">Edit</button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Orders View
const OrdersView: React.FC = () => {
  // Pending Order for Karla
  const pendingOrder = mockOrders.find(o => o.freelancerAddress === 'GDX7...R39P' && o.status === 'pending_acceptance');

  const [denyMsg, setDenyMsg] = useState('');
  const [showDenyInput, setShowDenyInput] = useState(false);

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-bold text-lg text-white">Active Requests</h3>

      {pendingOrder ? (
        <div className="p-6 rounded-xl glass-card border border-neoncyan/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
           <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-[10px] uppercase font-bold tracking-wider text-neoncyan mb-1">New Request</p>
               <p className="text-sm font-bold text-white">Client: {pendingOrder.clientName}</p>
               <p className="text-xs text-gray-400 mt-1">Total: ${pendingOrder.priceUSD} • Upfront: {pendingOrder.upfrontPercentage}%</p>
             </div>
             <span className="px-3 py-1 rounded bg-neoncyan/10 text-neoncyan font-bold text-xs">Waiting for Acceptance</span>
           </div>

           {/* Mock Message View */}
           <div className="bg-obsidian border border-white/5 p-3 rounded-lg mb-4 text-xs">
             <p className="text-gray-400 font-bold mb-1">Message from {pendingOrder.clientName}:</p>
             <p className="text-gray-300 italic">&quot;{pendingOrder.chatMessages[0].text}&quot;</p>
           </div>

           {!showDenyInput ? (
             <div className="flex gap-3">
               <button className="flex-1 py-2 rounded bg-neongreen text-obsidian font-heading font-bold text-xs uppercase hover:shadow-[0_0_10px_rgba(57,255,20,0.4)] transition-all flex items-center justify-center gap-1 cursor-pointer">
                 <Check className="w-4 h-4" /> Accept & Wait for Escrow
               </button>
               <button
                 onClick={() => setShowDenyInput(true)}
                 className="flex-1 py-2 rounded bg-white/5 text-white font-heading font-bold text-xs uppercase hover:bg-white/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
               >
                 <X className="w-4 h-4" /> Decline
               </button>
             </div>
           ) : (
             <div className="space-y-3">
               <textarea
                 value={denyMsg}
                 onChange={(e) => setDenyMsg(e.target.value)}
                 placeholder="Reason for declining (Optional)..."
                 className="w-full bg-obsidian border border-white/10 rounded-lg p-3 text-xs text-white resize-none"
               />
               <div className="flex gap-2">
                 <button className="px-4 py-1.5 rounded bg-hotpink text-white font-bold text-xs cursor-pointer">Confirm Decline</button>
                 <button onClick={() => setShowDenyInput(false)} className="px-4 py-1.5 rounded text-gray-400 text-xs hover:text-white cursor-pointer">Cancel</button>
               </div>
             </div>
           )}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No active orders or requests.</p>
      )}
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
