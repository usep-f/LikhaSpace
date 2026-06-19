'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useNotification } from '@/context/NotificationContext';
import { MessageSquare, ExternalLink, ShieldCheck, Activity, X, ShieldAlert } from 'lucide-react';
import { Order, Gig } from '@/lib/types';
import { ChatModal } from '@/components/ChatModal';
import { DeliverablesModal } from '@/components/DeliverablesModal';
import { StatusModal } from '@/components/StatusModal';
import { CancelModal } from '@/components/CancelModal';
import { DisputeModal } from '@/components/DisputeModal';
import { ReviewModal } from '@/components/ReviewModal';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { UserWalletInfo } from '@/components/ui/UserWalletInfo';
import { Pagination } from '@/components/Pagination';
import { DashboardSearch } from '@/components/DashboardSearch';
import { ProfileModal } from '@/components/ProfileModal';
import { subscribeToClientOrders, updateOrderStatus, getGig, createNotification, getUserProfile } from '@/lib/db';
import { deployAndInitializeEscrow, fundEscrow, getRequiredXlmForGig, getOraclePrice, cancelUnfunded, clientCancelWithKillFee, requestMediation } from '@/lib/contract';
import { getXlmBalance } from '@/lib/stellar';

function getStatusBadge(order: Order) {
  if (order.status === 'pending_acceptance') return { text: 'Pending Acceptance', classes: 'bg-[#1a1400]/80 text-[#eab308] border border-[#eab308]/30 shadow-[0_0_8px_rgba(234,179,8,0.15)]' };
  if (order.status === 'awaiting_funding') return { text: 'Awaiting Funding', classes: 'bg-[#331133]/80 text-[#ff00ff] border border-[#ff00ff]/30 shadow-[0_0_8px_rgba(255,0,255,0.15)]' };
  if (order.status === 'delivered') return { text: 'Delivered', classes: 'bg-[#001a00]/80 text-[#39ff14] border border-[#39ff14]/30 shadow-[0_0_8px_rgba(57,255,20,0.15)]' };
  if (order.status === 'disputed') return { text: 'Disputed', classes: 'bg-red-950/80 text-red-500 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.15)]' };
  if (order.status === 'mediation') return { text: 'In Mediation', classes: 'bg-orange-950/80 text-orange-500 border border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.15)]' };
  
  if (order.status === 'escrow_funded') {
    if (order.denialMessage) {
      return { text: 'Up For Revision', classes: 'bg-[#330000]/80 text-[#ff3333] border border-[#ff3333]/30 shadow-[0_0_8px_rgba(255,51,51,0.15)]' };
    }
    if (order.currentMilestoneIdx && order.currentMilestoneIdx > 0) {
      return { text: `Milestone ${order.currentMilestoneIdx + 1} Active`, classes: 'bg-[#001a1a]/80 text-[#00ffff] border border-[#00ffff]/30 shadow-[0_0_8px_rgba(0,255,255,0.15)]' };
    }
    return { text: 'Escrow Funded', classes: 'bg-[#001a1a]/80 text-[#00ffff] border border-[#00ffff]/30 shadow-[0_0_8px_rgba(0,255,255,0.15)]' };
  }
  return { text: order.status.replace('_', ' '), classes: 'bg-white/10 text-white border border-white/20' };
}

function getMilestonesConfig(order: Order) {
  if (order.milestones && order.milestones.length > 0) {
    return order.milestones.map(m => ({
      payout_amount_usd: Math.round(m.payoutUSD * 100),
      max_revisions: m.maxRevisions
    }));
  }
  return [{
    payout_amount_usd: Math.round(order.priceUSD * 100),
    max_revisions: 2
  }];
}

async function checkEscrowBalance(address: string, priceUSD: number): Promise<boolean> {
  const balanceXlm = await getXlmBalance(address);
  const requiredXlm = await getRequiredXlmForGig(priceUSD);
  return balanceXlm >= requiredXlm + 5;
}

export const ActiveProjectsView: React.FC = () => {
  const { address, userProfile } = useWallet();
  const [clientOrders, setClientOrders] = useState<(Order & { gigInfo?: Gig })[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [activeDeliverablesOrder, setActiveDeliverablesOrder] = useState<Order | null>(null);
  const [activeStatusOrder, setActiveStatusOrder] = useState<Order | null>(null);
  const [activeCancelOrder, setActiveCancelOrder] = useState<Order | null>(null);
  const [activeDisputeOrder, setActiveDisputeOrder] = useState<Order | null>(null);
  const [activeReviewOrder, setActiveReviewOrder] = useState<Order | null>(null);
  const [activeFreelancerProfile, setActiveFreelancerProfile] = useState<FreelancerProfile | null>(null);

  const { showToast, showLoading, hideLoading } = useNotification();

  const handleViewFreelancerProfile = async (freelancerAddress: string) => {
    showLoading('Loading freelancer profile...');
    try {
      const p = await getUserProfile(freelancerAddress);
      if (p) {
        setActiveFreelancerProfile({
          address: freelancerAddress,
          name: p.name || 'Freelancer',
          title: p.title || '',
          bio: p.bio || '',
          totalEarnedXLM: p.totalEarnedXLM || 0,
          projectsCompleted: p.projectsCompleted || 0,
          averageRating: p.averageRating || 5.0,
          testimonials: p.testimonials || [],
          role: 'freelancer',
          github: p.github,
          linkedin: p.linkedin,
          twitter: p.twitter,
          portfolio: p.portfolio,
        });
      } else {
        showToast('Freelancer profile not found', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading profile', 'error');
    } finally {
      hideLoading();
    }
  };

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
      showLoading('Funding Escrow via Freighter...');
      const hasBalance = await checkEscrowBalance(address, order.priceUSD);
      if (!hasBalance) {
        const requiredXlm = await getRequiredXlmForGig(order.priceUSD);
        const actualBal = await getXlmBalance(address);
        showToast(`Insufficient funds! Need ~${(requiredXlm + 5).toFixed(2)} XLM, but you only have ${actualBal.toFixed(2)} XLM.`, 'error');
        hideLoading();
        return;
      }
      const contractId = await deployAndInitializeEscrow(
        address,
        order.freelancerAddress,
        1000,
        getMilestonesConfig(order)
      );
      const stroopsPerCent = await getOraclePrice();
      const totalXlmRequired = (BigInt(order.priceUSD * 100) * BigInt(stroopsPerCent)).toString();
      await fundEscrow(contractId, address, totalXlmRequired);
      
      const defaultMilestones = order.milestones?.length ? order.milestones.map((m, idx) => ({
        ...m,
        revisionsUsed: 0,
        state: idx === 0 ? ('active' as const) : ('locked' as const),
      })) : [{
        title: 'Final Deliverable',
        payoutUSD: order.priceUSD,
        maxRevisions: 2,
        revisionsUsed: 0,
        state: 'active' as const
      }];

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: 'Escrow contract deployed and funded on-chain. Project work is now active!'
      };

      await updateOrderStatus(order.id, { 
        status: 'escrow_funded', 
        txHash: contractId,
        milestones: defaultMilestones,
        currentMilestoneIdx: 0,
        progressPercentage: 0,
        changelogs: [...(order.changelogs || []), newChangelog]
      });
      await createNotification({
        recipientId: order.freelancerAddress,
        senderId: address!,
        senderName: userProfile?.name || 'Client',
        title: 'Escrow Funded',
        message: `Escrow has been funded. You can now start working on the project!`,
        type: 'escrow',
        orderId: order.id,
      });
      showToast('Escrow Successfully Funded!', 'success');
    } catch (e: unknown) {
      console.error(e);
      showToast(`Funding failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      hideLoading();
    }
  };

  const handleCancelUnfunded = async (order: Order) => {
    if (!address) return showToast('Wallet not connected', 'error');
    try {
      showLoading('Canceling booking on-chain...');
      if (order.txHash) {
        await cancelUnfunded(order.txHash, address);
      }

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: 'Booking cancelled by client before funding.',
      };

      await updateOrderStatus(order.id, {
        status: 'denied',
        changelogs: [...(order.changelogs || []), newChangelog]
      });

      await createNotification({
        recipientId: order.freelancerAddress,
        senderId: address!,
        senderName: userProfile?.name || 'Client',
        title: 'Booking Cancelled',
        message: `The booking was cancelled by the client before funding.`,
        type: 'escrow',
        orderId: order.id,
      });

      showToast('Booking cancelled successfully!', 'success');
    } catch (e: unknown) {
      console.error(e);
      showToast(`Cancellation failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      hideLoading();
    }
  };

  const handleCancelFunded = async (order: Order) => {
    if (!address || !order.txHash) return showToast('Missing contract or wallet data', 'error');
    try {
      showLoading('Canceling project with kill fee on-chain...');
      await clientCancelWithKillFee(order.txHash, address);

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: 'Project cancelled by client. Current milestone payout paid as kill fee, future milestones refunded.',
      };

      await updateOrderStatus(order.id, {
        status: 'denied',
        progressPercentage: 100,
        changelogs: [...(order.changelogs || []), newChangelog]
      });

      await createNotification({
        recipientId: order.freelancerAddress,
        senderId: address!,
        senderName: userProfile?.name || 'Client',
        title: 'Project Cancelled',
        message: `The project was cancelled by the client. Current milestone payout paid as kill fee, future milestones refunded.`,
        type: 'escrow',
        orderId: order.id,
      });

      showToast('Project cancelled and refunded successfully!', 'success');
      setActiveCancelOrder(null);
    } catch (e: unknown) {
      console.error(e);
      showToast(`Cancellation failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      hideLoading();
    }
  };

  const handleDisputeProject = async (order: Order) => {
    if (!address || !order.txHash) return showToast('Error: Missing contract or wallet data', 'error');
    try {
      showLoading('Initiating dispute on-chain...');
      await requestMediation(order.txHash, address);

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: 'Dispute initiated by client.',
      };

      await updateOrderStatus(order.id, {
        status: 'disputed',
        changelogs: [...(order.changelogs || []), newChangelog]
      });

      await createNotification({
        recipientId: order.freelancerAddress,
        senderId: address!,
        senderName: userProfile?.name || 'Client',
        title: 'Dispute Initiated',
        message: `A dispute has been initiated for this project.`,
        type: 'dispute',
        orderId: order.id,
      });

      showToast('Dispute initiated successfully!', 'success');
    } catch (e: unknown) {
      console.error(e);
      showToast(`Failed to initiate dispute: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      hideLoading();
    }
  };


  const handleApproveDeliverables = async (orderId: string) => {
    const order = clientOrders.find(o => o.id === orderId);
    if (!order || !order.txHash || !address) return showToast('Error: Missing contract data', 'error');
    try {
      showLoading(`Approving deliverables for order on-chain...`);
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
      
      await createNotification({
        recipientId: order.freelancerAddress,
        senderId: address!,
        senderName: userProfile?.name || 'Client',
        title: hasNext ? 'Milestone Approved' : 'Project Completed',
        message: hasNext 
          ? `Milestone "${order.milestones?.[order.currentMilestoneIdx || 0]?.title}" has been approved and funds released.`
          : `Your final deliverables have been approved. Project is complete!`,
        type: 'deliverable',
        orderId: orderId,
      });
      
      showToast(hasNext ? 'Milestone approved. Funds released!' : 'Final deliverable approved. Project completed!', 'success');
      setActiveDeliverablesOrder(null);
      if (!hasNext) {
        setActiveReviewOrder(order);
      }
    } catch (e: unknown) {
      console.error(e);
      showToast(`Approval failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      hideLoading();
    }
  };

  const handleDenyDeliverables = async (orderId: string, reason: string) => {
    const order = clientOrders.find(o => o.id === orderId);
    if (!order || !order.txHash || !address) return showToast('Error: Missing contract data', 'error');
    try {
      showLoading(`Denying deliverables on-chain...`);
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
      await createNotification({
        recipientId: order.freelancerAddress,
        senderId: address!,
        senderName: userProfile?.name || 'Client',
        title: 'Revision Requested',
        message: `Client requested a revision: "${reason}"`,
        type: 'deliverable',
        orderId: orderId,
      });
      showToast('Deliverable denied.', 'info');
      setActiveDeliverablesOrder(null);
    } catch (e: unknown) {
      console.error(e);
      showToast(`Denial failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      hideLoading();
    }
  };

  const handlePayForRevision = async (orderId: string, reason: string) => {
    const order = clientOrders.find(o => o.id === orderId);
    if (!order || !order.txHash || !address) return showToast('Error: Missing data', 'error');
    
    try {
      showLoading(`Paying for additional revision on-chain...`);
      const stroopsPerCent = await getOraclePrice();
      // Assume paid revision price is 1000 ($10) as in deployment
      const totalXlmRequired = (BigInt(1000) * BigInt(stroopsPerCent)).toString();
      
      const contract = await import('@/lib/contract');
      await contract.payForRevision(order.txHash!, address, totalXlmRequired);
      
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
      await createNotification({
        recipientId: order.freelancerAddress,
        senderId: address!,
        senderName: userProfile?.name || 'Client',
        title: 'Revision Requested',
        message: `Client requested a revision: "${reason}"`,
        type: 'deliverable',
        orderId: orderId,
      });
      showToast('Revision purchased and deliverable denied successfully!', 'success');
      setActiveDeliverablesOrder(null);
    } catch (e: unknown) {
      console.error(e);
      showToast(`Transaction failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      hideLoading();
    }
  };

  const filteredOrders = clientOrders.filter(order => {
    if (order.status === 'completed' || order.status === 'denied' || order.status === 'settled_dispute') return false;
    const matchesSearch =
      order.freelancerAddress.toLowerCase().includes(search.toLowerCase()) ||
      (order.gigInfo?.freelancerName.toLowerCase() || '').includes(search.toLowerCase()) ||
      (order.gigInfo?.title.toLowerCase() || '').includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'disputed' && (order.status === 'disputed' || order.status === 'mediation')) || 
      order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Pending Approval', value: 'pending_acceptance' },
    { label: 'Pending Escrow', value: 'awaiting_funding' },
    { label: 'Active Escrow', value: 'escrow_funded' },
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
          <div key={order.id} className={`p-6 rounded-xl glass-card border flex flex-col md:flex-row justify-between items-center gap-6 ${
            order.status === 'pending_acceptance' ? 'border-neoncyan/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]' :
            order.status === 'delivered' ? 'border-neongreen/30 shadow-[0_0_15px_rgba(57,255,20,0.1)]' :
            'border-white/5'
          }`}>
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-1">
                <p className={`text-[10px] uppercase font-bold tracking-wider ${
                  order.status === 'pending_acceptance' ? 'text-neoncyan' : 'text-gray-400'
                }`}>
                  {order.status === 'pending_acceptance' ? 'Pending Acceptance' : 'Active Booking'}
                </p>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => handleViewFreelancerProfile(order.freelancerAddress)}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleViewFreelancerProfile(order.freelancerAddress) }}
                  className="text-left hover:opacity-80 transition-opacity block cursor-pointer"
                  title="View Freelancer Profile"
                >
                  <UserWalletInfo
                    address={order.freelancerAddress}
                    role="freelancer"
                    fallbackName={order.gigInfo?.freelancerName}
                  />
                </div>
                <ShieldCheck className="w-3.5 h-3.5 text-neongreen" />
              </div>
              <p className="text-xs text-gray-400 mt-1">{order.gigInfo?.title}</p>
              
              <div className="bg-obsidian rounded-lg p-4 border border-white/5 max-w-sm mt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Total Budget:</span>
                  <span className="font-bold text-white">${order.priceUSD} USD</span>
                </div>
              </div>
              {order.status === 'pending_acceptance' && (
                <p className="text-xs text-yellow-500 italic mt-2">Waiting for freelancer to accept request. Escrow funding will unlock upon acceptance.</p>
              )}
            </div>

            <div className="flex-1 w-full flex flex-col justify-end items-end gap-2">
              <div className="mb-1">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider font-heading ${getStatusBadge(order).classes}`}>
                  {getStatusBadge(order).text}
                </span>
              </div>

              <div className="flex gap-2 flex-wrap justify-end items-center">
                {order.status === 'pending_acceptance' && (
                  <button
                    title="Cancel Booking"
                    onClick={() => handleCancelUnfunded(order)}
                    className="p-2.5 rounded bg-red-500/20 border border-red-500 text-red-500 hover:bg-red-500/40 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                {order.status !== 'pending_acceptance' && (
                  <>
                    {order.status === 'awaiting_funding' && (
                      <button
                        title="Fund Escrow"
                        onClick={() => handleFundEscrow(order)}
                        className="p-2.5 rounded border bg-[#ff00ff]/20 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff]/40 cursor-pointer shadow-[0_0_10px_rgba(255,0,255,0.3)] transition-colors"
                      >
                        <Activity className="w-5 h-5" />
                      </button>
                    )}
                    {(order.status === 'escrow_funded' || order.status === 'delivered') && (
                      <button
                        title="View Deliverables"
                        onClick={() => setActiveDeliverablesOrder(order)}
                        className="p-2.5 rounded bg-[#001a1a]/40 border border-[#00ffff]/30 text-[#00ffff] hover:bg-[#001a1a]/60 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    )}
                    {(order.status === 'disputed' || order.status === 'mediation') && (
                      <button
                        title="Dispute Panel"
                        onClick={() => setActiveDisputeOrder(order)}
                        className="p-2.5 rounded transition-colors font-bold text-xs uppercase tracking-wider px-4 py-2 border bg-yellow-500/20 border-yellow-500 text-yellow-500 hover:bg-yellow-500/40 cursor-pointer shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                      >
                        Dispute Panel
                      </button>
                    )}
                    <button
                      title="Message"
                      onClick={() => setActiveChatOrder(order)}
                      className="p-2.5 rounded bg-[#141026] border border-white/10 text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <button
                      title="View Status"
                      onClick={() => setActiveStatusOrder(order)}
                      className="p-2.5 rounded bg-white text-black hover:shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-all cursor-pointer"
                    >
                      <Activity className="w-5 h-5" />
                    </button>
                  </>
                )}

                <DropdownMenu 
                  items={[
                    ...(order.status === 'awaiting_funding' ? [{
                      label: 'Cancel Booking',
                      icon: <X className="w-4 h-4" />,
                      destructive: true,
                      onClick: () => handleCancelUnfunded(order)
                    }] : []),
                    ...((order.status === 'escrow_funded' || order.status === 'delivered') ? [
                      {
                        label: 'Cancel Project',
                        icon: <X className="w-4 h-4" />,
                        destructive: true,
                        onClick: () => setActiveCancelOrder(order)
                      },
                      {
                        label: 'Dispute Project',
                        icon: <ShieldAlert className="w-4 h-4" />,
                        destructive: true,
                        onClick: () => order.hasSubmittedOnce ? handleDisputeProject(order) : showToast('Dispute locked until first submission', 'error')
                      }
                    ] : [])
                  ]}
                />
              </div>
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
          onPayRevision={handlePayForRevision}
        />
      )}

      {activeStatusOrder && (
        <StatusModal
          order={activeStatusOrder}
          onClose={() => setActiveStatusOrder(null)}
        />
      )}

      {activeCancelOrder && (
        <CancelModal
          order={activeCancelOrder}
          onClose={() => setActiveCancelOrder(null)}
          onConfirm={() => handleCancelFunded(activeCancelOrder)}
        />
      )}

      {activeDisputeOrder && address && (
        <DisputeModal
          order={activeDisputeOrder}
          currentAddress={address}
          onClose={() => setActiveDisputeOrder(null)}
          onSuccess={() => {
            setActiveDisputeOrder(null);
          }}
        />
      )}

      {activeReviewOrder && (
        <ReviewModal
          order={activeReviewOrder}
          onClose={() => setActiveReviewOrder(null)}
          onReviewSubmitted={() => setActiveReviewOrder(null)}
        />
      )}

      {activeFreelancerProfile && (
        <ProfileModal
          profile={activeFreelancerProfile}
          onClose={() => setActiveFreelancerProfile(null)}
        />
      )}
    </div>
  );
};
