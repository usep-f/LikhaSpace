'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar } from 'lucide-react';
import { Order, Gig } from '@/lib/mockGigs';
import { Pagination } from '@/components/Pagination';
import { DashboardSearch } from '@/components/DashboardSearch';
import { subscribeToMediatorOrders, getGig } from '@/lib/db';

export const HistoryView: React.FC = () => {
  const [orders, setOrders] = useState<(Order & { gigInfo?: Gig })[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const unsubscribe = subscribeToMediatorOrders(async (fetchedOrders) => {
      // Filter only settled disputes
      const settledOrders = fetchedOrders.filter(o => o.status === 'settled_dispute');
      
      const enriched = await Promise.all(
        settledOrders.map(async (o) => {
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
        <h3 className="font-heading font-bold text-lg text-white">Settlement History</h3>
      </div>

      <DashboardSearch
        value={search}
        onChange={(val) => { setSearch(val); setCurrentPage(1); }}
        placeholder="Search by address or service title..."
      />

      {paginatedOrders.length > 0 ? (
        paginatedOrders.map(order => (
          <div key={order.id} className="p-6 rounded-xl glass-card border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)] flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-green-500">
                  Resolved Dispute
                </p>
              </div>
              <p className="text-sm font-bold text-white flex items-center gap-1 mb-1">
                Freelancer: {order.gigInfo?.freelancerName || order.freelancerAddress} <ShieldCheck className="w-3.5 h-3.5 text-neongreen" />
              </p>
              <p className="text-sm text-gray-300">Client: {order.clientName || order.clientAddress}</p>
              <p className="text-xs text-gray-400 mt-1">{order.gigInfo?.title}</p>
              
              <div className="bg-obsidian rounded-lg p-4 border border-white/5 max-w-sm mt-3">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Total Budget:</span>
                  <span className="font-bold text-white">${order.priceUSD} USD</span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full flex flex-col justify-end items-end gap-2">
              <div className="mb-1">
                <span className="bg-green-950/80 text-green-500 border border-green-500/30 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider font-heading">
                  Settled
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="py-12 text-center border border-white/5 rounded-xl glass-card">
          <p className="text-sm text-gray-400">No settled disputes found.</p>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
