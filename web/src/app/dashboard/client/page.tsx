'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Briefcase, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';
import { mockOrders, Order } from '@/lib/mockGigs';

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
  // Mock finding orders for this client
  const clientOrders = mockOrders.filter(o => o.clientAddress === 'GCLIENT...123' || o.clientAddress === 'GCLIENT...456');

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-bold text-lg text-white">My Active Bookings</h3>

      {clientOrders.map(order => (
        <div key={order.id} className="p-6 rounded-xl glass-card border border-white/5 flex flex-col md:flex-row gap-6">

          {/* Order Info */}
          <div className="flex-1 space-y-4 border-r border-white/5 pr-6">
            <div className="flex justify-between items-start">
              <div>
                 <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Freelancer</p>
                 <p className="text-sm font-bold text-white flex items-center gap-1">
                   {order.freelancerAddress} <ShieldCheck className="w-3.5 h-3.5 text-neongreen" />
                 </p>
              </div>
              <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                order.status === 'pending_acceptance' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                order.status === 'escrow_funded' ? 'bg-neoncyan/10 text-neoncyan border border-neoncyan/20' :
                'bg-white/10 text-white'
              }`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>

            <div className="bg-obsidian rounded-lg p-4 border border-white/5">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400">Total Budget:</span>
                <span className="font-bold text-white">${order.priceUSD} USD</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Upfront Released ({order.upfrontPercentage}%):</span>
                <span className="font-bold text-neongreen">${(order.priceUSD * (order.upfrontPercentage / 100)).toFixed(2)} USD</span>
              </div>
            </div>

            {/* Action Buttons based on status */}
            {order.status === 'pending_acceptance' && (
              <p className="text-xs text-yellow-500 italic">Waiting for freelancer to accept request. Escrow funding will unlock upon acceptance.</p>
            )}

            {order.status === 'escrow_funded' && (
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded bg-neongreen text-obsidian font-bold text-xs uppercase hover:shadow-[0_0_10px_rgba(57,255,20,0.4)] transition-all cursor-pointer">
                  Approve & Release Funds
                </button>
                <button className="px-4 py-2 rounded border border-hotpink/50 text-hotpink font-bold text-xs hover:bg-hotpink/10 transition-colors cursor-pointer">
                  Dispute
                </button>
              </div>
            )}
          </div>

          {/* Chat Mockup */}
          <div className="flex-1 flex flex-col bg-obsidian rounded-xl border border-white/5 overflow-hidden">
            <div className="bg-white/5 p-3 flex items-center gap-2 border-b border-white/5">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-white">Project Chat</span>
            </div>
            <div className="flex-1 p-4 space-y-4 max-h-48 overflow-y-auto">
              {order.chatMessages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.senderAddress === order.clientAddress ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] text-gray-500 mb-1">{msg.senderAddress === order.clientAddress ? 'You' : 'Freelancer'}</span>
                  <div className={`p-2.5 rounded-lg text-xs max-w-[85%] ${
                    msg.senderAddress === order.clientAddress ? 'bg-neoncyan/20 text-white' : 'bg-white/5 text-gray-300'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/5 bg-white/5 flex gap-2">
              <input type="text" placeholder="Type a message..." className="flex-1 bg-obsidian border border-white/10 rounded px-3 py-1.5 text-xs text-white" />
              <button className="px-3 py-1.5 bg-neoncyan text-obsidian rounded text-xs font-bold cursor-pointer">Send</button>
            </div>
          </div>

        </div>
      ))}
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
