'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, MessageSquare, ShieldAlert } from 'lucide-react';
import { Order, Gig } from '@/lib/mockGigs';
import { UserWalletInfo } from '@/components/ui/UserWalletInfo';
import { Pagination } from '@/components/Pagination';
import { DashboardSearch } from '@/components/DashboardSearch';
import { subscribeToMediatorOrders, getGig } from '@/lib/db';
import { ChatModal } from '@/components/ChatModal';
import { ResolveDisputeModal } from '@/components/ResolveDisputeModal';

export const ActiveDisputesView: React.FC = () => {
  const [orders, setOrders] = useState<(Order & { gigInfo?: Gig })[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [activeResolveOrder, setActiveResolveOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMediatorOrders(async (fetchedOrders) => {
      // Filter only mediation
      const disputedOrders = fetchedOrders.filter(o => o.status === 'mediation');
      
      const enriched = await Promise.all(
        disputedOrders.map(async (o) => {
          const gigInfo = await getGig(o.gigId);
          return { ...o, gigInfo: gigInfo || undefined };
        })
      );
      setOrders(enriched);
    });
    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.freelancerAddress.toLowerCase().includes(search.toLowerCase()) ||
      order.clientAddress.toLowerCase().includes(search.toLowerCase()) ||
      (order.gigInfo?.title.toLowerCase() || '').includes(search.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-bold text-lg text-white">Active Disputes</h3>
      </div>

      <DashboardSearch
        value={search}
        onChange={(val) => { setSearch(val); setCurrentPage(1); }}
        placeholder="Search by address or service title..."
      />

      {paginatedOrders.length > 0 ? (
        paginatedOrders.map(order => (
          <div key={order.id} className="p-6 rounded-xl glass-card border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)] flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-red-500">
                  Dispute Review
                </p>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <UserWalletInfo
                  address={order.freelancerAddress}
                  role="freelancer"
                  fallbackName={order.gigInfo?.freelancerName}
                />
                <ShieldCheck className="w-3.5 h-3.5 text-neongreen" />
              </div>
              <UserWalletInfo
                address={order.clientAddress}
                role="client"
                fallbackName={order.clientName}
                className="mb-1"
              />
              <p className="text-xs text-gray-400 mt-1">{order.gigInfo?.title}</p>
              
              <div className="bg-obsidian rounded-lg p-4 border border-white/5 max-w-sm mt-3">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Total Budget:</span>
                  <span className="font-bold text-white">${order.priceUSD} USD</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Locked Funds (Approx):</span>
                  <span className="font-bold text-yellow-500">
                    ${order.priceUSD.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full flex flex-col justify-end items-end gap-2">
              <div className="mb-1">
                <span className="bg-red-950/80 text-red-500 border border-red-500/30 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider font-heading">
                  Disputed
                </span>
              </div>

              <div className="flex gap-2 flex-wrap justify-end mt-4">
                <button
                  title="View Chat History"
                  onClick={() => setActiveChatOrder(order)}
                  className="p-2.5 rounded bg-[#141026] border border-white/10 text-white hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-xs font-bold">Chat Log</span>
                </button>
                <button
                  title="Resolve Dispute"
                  onClick={() => setActiveResolveOrder(order)}
                  className="p-2.5 rounded bg-neoncyan/20 border border-neoncyan text-neoncyan hover:bg-neoncyan/40 transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,255,255,0.2)] flex items-center gap-2"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase">Resolve</span>
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="py-12 text-center border border-white/5 rounded-xl glass-card">
          <p className="text-sm text-gray-400">No active disputes.</p>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {activeChatOrder && (
        <ChatModal
          order={activeChatOrder}
          currentAddress={process.env.NEXT_PUBLIC_MEDIATOR_ADDRESS!} // mediator views as themselves
          onClose={() => setActiveChatOrder(null)}
        />
      )}

      {activeResolveOrder && (
        <ResolveDisputeModal
          order={activeResolveOrder}
          onClose={() => setActiveResolveOrder(null)}
          onSuccess={() => setActiveResolveOrder(null)}
        />
      )}
    </div>
  );
};
