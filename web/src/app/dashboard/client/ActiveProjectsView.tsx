'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useNotification } from '@/context/NotificationContext';
import { MessageSquare, ExternalLink, ShieldCheck, Activity } from 'lucide-react';
import { Order, Gig } from '@/lib/mockGigs';
import { ChatModal } from '@/components/ChatModal';
import { DeliverablesModal } from '@/components/DeliverablesModal';
import { StatusModal } from '@/components/StatusModal';
import { Pagination } from '@/components/Pagination';
import { DashboardSearch } from '@/components/DashboardSearch';
import { subscribeToClientOrders, updateOrderStatus, getGig } from '@/lib/db';
import { deployAndInitializeEscrow, fundEscrow, getRequiredXlmForGig, getOraclePrice } from '@/lib/contract';
import { getXlmBalance } from '@/lib/stellar';

function getMilestonesConfig(order: Order) {
  if (order.milestones && order.milestones.length > 0) {
    return order.milestones.map(m => ({
      payout_amount_usd: Math.round(m.payoutUSD * 100),
      max_revisions: m.maxRevisions
    }));
  }
  const remainingPercent = 1 - order.upfrontPercentage / 100;
  return [{
    payout_amount_usd: Math.round(order.priceUSD * remainingPercent * 100),
    max_revisions: 2
  }];
}

async function checkEscrowBalance(address: string, priceUSD: number): Promise<boolean> {
  const balanceXlm = await getXlmBalance(address);
  const requiredXlm = await getRequiredXlmForGig(priceUSD);
  return balanceXlm >= requiredXlm + 5;
}

export const ActiveProjectsView: React.FC = () => {
  const { address } = useWallet();
  const [clientOrders, setClientOrders] = useState<(Order & { gigInfo?: Gig })[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [activeDeliverablesOrder, setActiveDeliverablesOrder] = useState<Order | null>(null);
  const [activeStatusOrder, setActiveStatusOrder] = useState<Order | null>(null);

  const { showToast } = useNotification();

  React.useEffect(() => {
    if (!address) return;
    const unsubscribe = subscribeToClientOrders(address, async (orders) => {
      const enriched = await Promise.all(
        orders.map(async (o) => {
          const gigInfo = await getGig(o.gigId);
          return { ...o, gigInfo: gigInfo || undefined };
        })
      );
      setClientOrders(enriched);
    });
    return () => unsubscribe();
  }, [address]);

  const handleFundEscrow = async (order: Order) => {
    if (!address) return showToast('Wallet not connected', 'error');
    showToast('Checking wallet balance...', 'info');
    try {
      const hasBalance = await checkEscrowBalance(address, order.priceUSD);
      if (!hasBalance) {
        const requiredXlm = await getRequiredXlmForGig(order.priceUSD);
        const actualBal = await getXlmBalance(address);
        showToast(`Insufficient funds! Need ~${(requiredXlm + 5).toFixed(2)} XLM, but you only have ${actualBal.toFixed(2)} XLM.`, 'error');
        return;
      }
      showToast('Deploying & Funding Escrow...', 'info');
      const contractId = await deployAndInitializeEscrow(
        address,
        order.freelancerAddress,
        Math.round(order.priceUSD * (order.upfrontPercentage / 100) * 100),
        1000,
        getMilestonesConfig(order)
      );
      showToast('Contract Deployed! Proceeding to fund...', 'info');
      const stroopsPerCent = await getOraclePrice();
      const totalXlmRequired = (BigInt(order.priceUSD * 100) * BigInt(stroopsPerCent)).toString();
      await fundEscrow(contractId, address, totalXlmRequired);
      await updateOrderStatus(order.id, { status: 'escrow_funded', txHash: contractId });
      showToast('Escrow Successfully Funded!', 'success');
    } catch (e: unknown) {
      console.error(e);
      showToast(`Funding failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
  };

  const handleApproveDeliverables = async (orderId: string) => {
    const order = clientOrders.find(o => o.id === orderId);
    if (!order || !order.txHash || !address) return showToast('Error: Missing contract data', 'error');
    showToast(`Approving deliverables for order ${orderId} on-chain...`, 'info');
    try {
      await import('@/lib/contract').then(m => m.acceptDeliverable(order.txHash!, address));
      await updateOrderStatus(orderId, { status: 'completed' });
      showToast('Deliverable approved. Escrow funds released!', 'success');
      setActiveDeliverablesOrder(null);
    } catch (e: unknown) {
      console.error(e);
      showToast(`Approval failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
  };

  const handleDenyDeliverables = async (orderId: string, reason: string) => {
    const order = clientOrders.find(o => o.id === orderId);
    if (!order || !order.txHash || !address) return showToast('Error: Missing contract data', 'error');
    showToast(`Denying deliverables for order ${orderId} on-chain...`, 'info');
    try {
      await import('@/lib/contract').then(m => m.denyDeliverable(order.txHash!, address));
      await updateOrderStatus(orderId, { status: 'escrow_funded', denialMessage: reason });
      showToast('Deliverable denied.', 'info');
      setActiveDeliverablesOrder(null);
    } catch (e: unknown) {
      console.error(e);
      showToast(`Denial failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
  };

  const filteredOrders = clientOrders.filter(order => {
    const matchesSearch =
      order.freelancerAddress.toLowerCase().includes(search.toLowerCase()) ||
      (order.gigInfo?.freelancerName.toLowerCase() || '').includes(search.toLowerCase()) ||
      (order.gigInfo?.title.toLowerCase() || '').includes(search.toLowerCase());
    return matchesSearch && (statusFilter === 'all' || order.status === statusFilter);
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

            <div className="flex flex-col gap-3 w-full lg:w-64">
              <div className="mb-1 flex justify-start w-full">
                <span className={`w-full text-center py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider font-heading ${
                  order.status === 'pending_acceptance' ? 'bg-[#1a1400]/80 text-[#eab308] border border-[#eab308]/30 shadow-[0_0_8px_rgba(234,179,8,0.15)]' :
                  order.status === 'awaiting_funding' ? 'bg-[#331133]/80 text-[#ff00ff] border border-[#ff00ff]/30 shadow-[0_0_8px_rgba(255,0,255,0.15)]' :
                  order.status === 'escrow_funded' ? 'bg-[#001a1a]/80 text-[#00ffff] border border-[#00ffff]/30 shadow-[0_0_8px_rgba(0,255,255,0.15)]' :
                  order.status === 'delivered' ? 'bg-[#001a00]/80 text-[#39ff14] border border-[#39ff14]/30 shadow-[0_0_8px_rgba(57,255,20,0.15)]' :
                  'bg-white/10 text-white'
                }`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>

              {order.status === 'awaiting_funding' && (
                <button
                  onClick={() => handleFundEscrow(order)}
                  className="w-full py-2.5 rounded-lg bg-[#ff00ff]/20 border border-[#ff00ff] text-[#ff00ff] font-heading font-bold text-xs uppercase hover:bg-[#ff00ff]/40 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(255,0,255,0.3)]"
                >
                  <Activity className="w-4 h-4" /> Fund Escrow
                </button>
              )}

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
