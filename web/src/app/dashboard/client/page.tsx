'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Briefcase, MessageSquare, ExternalLink, ShieldCheck, Activity } from 'lucide-react';
import { mockOrders, Order } from '@/lib/mockGigs';
import { ChatModal } from '@/components/ChatModal';
import { DeliverablesModal } from '@/components/DeliverablesModal';
import { StatusModal } from '@/components/StatusModal';

// Tabs Navigation
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
  const clientOrders = mockOrders.filter(o => o.clientAddress === 'GCLIENT...123' || o.clientAddress === 'GCLIENT...456');

  // Modal States
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [activeDeliverablesOrder, setActiveDeliverablesOrder] = useState<Order | null>(null);
  const [activeStatusOrder, setActiveStatusOrder] = useState<Order | null>(null);

  const handleApproveDeliverables = (orderId: string) => {
    alert(`Approving deliverables for order ${orderId} and releasing Escrow funds!`);
    setActiveDeliverablesOrder(null);
  };

  const handleDenyDeliverables = (orderId: string, reason: string) => {
    alert(`Denying deliverables for order ${orderId}. Reason: ${reason}`);
    setActiveDeliverablesOrder(null);
  };

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-bold text-lg text-white">My Active Bookings</h3>

      {clientOrders.map(order => (
        <div key={order.id} className="p-6 rounded-xl glass-card border border-white/5 flex flex-col lg:flex-row justify-between items-start gap-6">

          {/* Order Info */}
          <div className="flex-1 space-y-4 w-full pt-1">
            <div>
               <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Freelancer</p>
               <p className="text-sm font-bold text-white flex items-center gap-1">
                 {order.freelancerAddress} <ShieldCheck className="w-3.5 h-3.5 text-neongreen" />
               </p>
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
      ))}

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
        {activeTab === 'profile' && <p className="text-sm text-gray-400">Profile management coming soon.</p>}
        {activeTab === 'history' && <p className="text-sm text-gray-400">Completed projects history coming soon.</p>}
      </div>
    </div>
  );
}
