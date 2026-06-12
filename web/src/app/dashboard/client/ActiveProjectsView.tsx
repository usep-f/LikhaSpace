'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useNotification } from '@/context/NotificationContext';
import { Order, Gig } from '@/lib/mockGigs';
import { ChatModal } from '@/components/ChatModal';
import { DeliverablesModal } from '@/components/DeliverablesModal';
import { StatusModal } from '@/components/StatusModal';
import { Pagination } from '@/components/Pagination';
import { DashboardSearch } from '@/components/DashboardSearch';
import { subscribeToClientOrders, updateOrderStatus, getGig } from '@/lib/db';
import { deployAndInitializeEscrow, fundEscrow, getRequiredXlmForGig, getOraclePrice } from '@/lib/contract';
import { getXlmBalance } from '@/lib/stellar';
import { ProjectCard } from '@/components/ProjectCard';

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

  const { showToast, showConfirm } = useNotification();

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
      
      const defaultMilestones = order.milestones?.length ? order.milestones.map((m, idx) => ({
        ...m,
        revisionsUsed: 0,
        state: idx === 0 ? ('active' as const) : ('locked' as const),
      })) : [{
        title: 'Final Deliverable',
        payoutUSD: order.priceUSD * (1 - order.upfrontPercentage / 100),
        maxRevisions: 2,
        revisionsUsed: 0,
        state: 'active' as const
      }];

      await updateOrderStatus(order.id, { 
        status: 'escrow_funded', 
        txHash: contractId,
        milestones: defaultMilestones,
        currentMilestoneIdx: 0,
        progressPercentage: 0
      });
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
      
      const milestones = order.milestones ? [...order.milestones] : [];
      const currentIdx = order.currentMilestoneIdx || 0;
      
      if (milestones[currentIdx]) {
        milestones[currentIdx].state = 'approved';
      }
      
      const nextIdx = currentIdx + 1;
      const hasNext = nextIdx < milestones.length;
      
      if (hasNext) {
        milestones[nextIdx].state = 'active';
      }
      
      const approvedCount = milestones.filter(m => m.state === 'approved').length;
      const progressPercentage = Math.round((approvedCount / Math.max(milestones.length, 1)) * 100);
      
      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: hasNext 
          ? `Approved milestone: ${milestones[currentIdx]?.title || 'Deliverable'}. Next milestone is now active.`
          : `Approved final milestone: ${milestones[currentIdx]?.title || 'Deliverable'}. Project completed!`,
      };

      await updateOrderStatus(orderId, { 
        status: hasNext ? 'escrow_funded' : 'completed',
        milestones,
        currentMilestoneIdx: nextIdx,
        progressPercentage,
        changelogs: [...(order.changelogs || []), newChangelog]
      });
      
      showToast(hasNext ? 'Milestone approved. Funds released!' : 'Final deliverable approved. Project completed!', 'success');
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
      
      const milestones = order.milestones ? [...order.milestones] : [];
      const currentIdx = order.currentMilestoneIdx || 0;
      
      if (milestones[currentIdx]) {
        milestones[currentIdx].state = 'active';
        milestones[currentIdx].revisionsUsed = (milestones[currentIdx].revisionsUsed || 0) + 1;
      }

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: `Denied deliverable for milestone: ${milestones[currentIdx]?.title || 'Deliverable'}. Reason: ${reason}`
      };

      await updateOrderStatus(orderId, { 
        status: 'escrow_funded', 
        denialMessage: reason,
        milestones,
        changelogs: [...(order.changelogs || []), newChangelog]
      });
      showToast('Deliverable denied.', 'info');
      setActiveDeliverablesOrder(null);
    } catch (e: unknown) {
      console.error(e);
      showToast(`Denial failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
  };

  const handlePayForRevision = async (orderId: string, reason: string) => {
    const order = clientOrders.find(o => o.id === orderId);
    if (!order || !order.txHash || !address) return showToast('Error: Missing data', 'error');
    
    showToast(`Paying for additional revision on-chain...`, 'info');
    try {
      const stroopsPerCent = await getOraclePrice();
      // Assume paid revision price is 1000 ($10) as in deployment
      const totalXlmRequired = (BigInt(1000) * BigInt(stroopsPerCent)).toString();
      
      const contract = await import('@/lib/contract');
      await contract.payForRevision(order.txHash!, address, totalXlmRequired);
      
      showToast(`Revision paid! Authorizing deliverable denial on-chain...`, 'info');
      await contract.denyDeliverable(order.txHash!, address);
      
      const milestones = order.milestones ? [...order.milestones] : [];
      const currentIdx = order.currentMilestoneIdx || 0;
      
      if (milestones[currentIdx]) {
        milestones[currentIdx].maxRevisions += 1;
        milestones[currentIdx].revisionsUsed = (milestones[currentIdx].revisionsUsed || 0) + 1;
        milestones[currentIdx].state = 'active';
      }
      
      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: `Purchased additional revision & denied milestone: ${milestones[currentIdx]?.title || 'Deliverable'}. Reason: ${reason}`
      };

      await updateOrderStatus(orderId, { 
        status: 'escrow_funded',
        denialMessage: reason,
        milestones,
        changelogs: [...(order.changelogs || []), newChangelog]
      });
      showToast('Revision purchased and deliverable denied successfully!', 'success');
      setActiveDeliverablesOrder(null);
    } catch (e: unknown) {
      console.error(e);
      showToast(`Transaction failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
  };

  const handleCancelOrder = (orderId: string) => {
    showConfirm(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      async () => {
        showToast('Cancelling order...', 'info');
        try {
          const { cancelOrder } = await import('@/lib/db');
          await cancelOrder(orderId);
          showToast('Order cancelled successfully', 'success');
        } catch (e: unknown) {
          console.error(e);
          showToast(`Failed to cancel order: ${e instanceof Error ? e.message : String(e)}`, 'error');
        }
      }
    );
  };

  const handleClaimRefund = (order: Order) => {
    showConfirm(
      'Claim Refund',
      'Are you sure you want to claim a refund? This is only possible if the freelancer has been inactive past their required timeout period.',
      async () => {
        if (!address || !order.txHash) return;
        showToast('Claiming refund on-chain...', 'info');
        try {
          const { claimRefundTimeout } = await import('@/lib/contract');
          const { cancelOrder } = await import('@/lib/db');
          await claimRefundTimeout(order.txHash, address);
          await cancelOrder(order.id);
          showToast('Refund claimed successfully', 'success');
        } catch (e: unknown) {
          console.error(e);
          showToast(`Failed to claim refund: ${e instanceof Error ? e.message : String(e)}`, 'error');
        }
      }
    );
  };

  const filteredOrders = clientOrders.filter(order => {
    if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'denied') return false;
    const matchesSearch =
      order.freelancerAddress.toLowerCase().includes(search.toLowerCase()) ||
      (order.gigInfo?.freelancerName.toLowerCase() || '').includes(search.toLowerCase()) ||
      (order.gigInfo?.title.toLowerCase() || '').includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      order.status === statusFilter ||
      (statusFilter === 'escrow_funded' && (order.status === 'delivered' || order.status === 'disputed'));

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Pending Acceptance', value: 'pending_acceptance' },
    { label: 'Pending Escrow', value: 'awaiting_funding' },
    { label: 'Escrow Funded (Active)', value: 'escrow_funded' }
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
          <ProjectCard
            key={order.id}
            order={order}
            perspective="client"
            onFundEscrow={handleFundEscrow}
            onMessage={setActiveChatOrder}
            onViewDeliverables={setActiveDeliverablesOrder}
            onViewStatus={setActiveStatusOrder}
            onCancelOrder={handleCancelOrder}
            onClaimRefund={handleClaimRefund}
          />
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
          onPayRevision={handlePayForRevision}
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
