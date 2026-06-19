'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useNotification } from '@/context/NotificationContext';
import { Order, FreelancerProfile } from '@/lib/types';
import { subscribeToFreelancerOrders, updateOrderStatus, createNotification, getUserProfile } from '@/lib/db';
import { freelancerCancel, cancelUnfunded, requestMediation } from '@/lib/contract';
import { denialMessageSchema, sanitizeInput } from '@/lib/validation';
import { Pagination } from '@/components/Pagination';
import { DashboardSearch } from '@/components/DashboardSearch';
import { ProposalModal } from '@/components/ProposalModal';
import { ChatModal } from '@/components/ChatModal';
import { StatusModal } from '@/components/StatusModal';
import { SubmitDeliverableModal } from '@/components/SubmitDeliverableModal';
import { DisputeModal } from '@/components/DisputeModal';
import { ProfileModal } from '@/components/ProfileModal';
import { OrderCard } from './OrderCard';

export const OrdersView: React.FC = () => {
  const { address, userProfile } = useWallet();
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const { showToast, showConfirm, showLoading, hideLoading } = useNotification();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [showDenyInput, setShowDenyInput] = useState<Record<string, boolean>>({});
  const [denyMsgs, setDenyMsgs] = useState<Record<string, string>>({});

  const [activeProposalOrder, setActiveProposalOrder] = useState<Order | null>(null);
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [activeStatusOrder, setActiveStatusOrder] = useState<Order | null>(null);
  const [activeSubmitOrder, setActiveSubmitOrder] = useState<Order | null>(null);
  const [activeDisputeOrder, setActiveDisputeOrder] = useState<Order | null>(null);
  const [activeClientProfile, setActiveClientProfile] = useState<FreelancerProfile | null>(null);

  useEffect(() => {
    if (!address) return;
    const unsubscribe = subscribeToFreelancerOrders(address, (orders) => {
      setMyOrders(orders);
    });
    return () => unsubscribe();
  }, [address]);

  const handleViewClientProfile = async (clientAddress: string) => {
    showLoading('Loading client profile...');
    try {
      const p = await getUserProfile(clientAddress);
      if (p) {
        setActiveClientProfile({
          address: clientAddress,
          name: p.name || 'Client',
          title: p.title || '',
          bio: p.bio || '',
          totalEarnedXLM: 0,
          projectsCompleted: 0,
          averageRating: 5.0,
          testimonials: [],
          role: 'client',
          github: p.github,
          linkedin: p.linkedin,
          twitter: p.twitter,
          portfolio: p.portfolio,
        });
      } else {
        showToast('Client profile not found', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading profile', 'error');
    } finally {
      hideLoading();
    }
  };

  const handleAcceptBooking = async (orderId: string) => {
    const order = myOrders.find(o => o.id === orderId);
    try {
      showLoading('Accepting booking request...');
      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: 'Booking request accepted by freelancer. Awaiting escrow funding.'
      };
      await updateOrderStatus(orderId, { 
        status: 'awaiting_funding',
        changelogs: [...(order?.changelogs || []), newChangelog]
      });
      await createNotification({
        recipientId: order!.clientAddress,
        senderId: address!,
        senderName: userProfile?.name || 'Freelancer',
        title: 'Booking Accepted',
        message: `Your booking request has been accepted. Awaiting escrow funding.`,
        type: 'escrow',
        orderId: orderId,
      });
      showToast('Booking accepted! Waiting for client to fund the escrow.', 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast(`Error accepting booking: ${msg}`, 'error');
    } finally {
      hideLoading();
    }
  };

  const handleDenyRequest = async (orderId: string) => {
    const order = myOrders.find(o => o.id === orderId);
    try {
      showLoading('Declining booking request...');
      let msg = denyMsgs[orderId] || '';
      
      const parsed = denialMessageSchema.safeParse({ message: msg });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      msg = sanitizeInput(parsed.data.message || '');

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: `Booking request declined by freelancer.${msg ? ` Reason: ${msg}` : ''}`
      };

      await updateOrderStatus(orderId, { 
        status: 'denied',
        denialMessage: msg,
        changelogs: [...(order?.changelogs || []), newChangelog]
      });
      await createNotification({
        recipientId: order!.clientAddress,
        senderId: address!,
        senderName: userProfile?.name || 'Freelancer',
        title: 'Booking Declined',
        message: `Your booking request was declined.`,
        type: 'escrow',
        orderId: orderId,
      });
      setShowDenyInput(prev => ({ ...prev, [orderId]: false }));
      showToast('Booking request declined.', 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast(`Error declining booking: ${msg}`, 'error');
    } finally {
      hideLoading();
    }
  };

  const handleCancelUnfunded = async (order: Order) => {
    showConfirm(
      'Cancel Booking Request',
      'Are you sure you want to cancel this booking request before it is funded?',
      async () => {
        if (!address) return showToast('Wallet not connected', 'error');
        try {
          showLoading('Canceling booking request on-chain...');
          if (order.txHash) await cancelUnfunded(order.txHash, address);

          const newChangelog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            message: 'Booking request cancelled by freelancer before funding.',
          };

          await updateOrderStatus(order.id, {
            status: 'denied',
            changelogs: [...(order.changelogs || []), newChangelog]
          });
          await createNotification({
            recipientId: order.clientAddress,
            senderId: address!,
            senderName: userProfile?.name || 'Freelancer',
            title: 'Booking Cancelled',
            message: `The booking request was cancelled by the freelancer before funding.`,
            type: 'escrow',
            orderId: order.id,
          });
          showToast('Booking request cancelled successfully!', 'success');
        } catch (e: unknown) {
          showToast(`Cancellation failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
        } finally {
          hideLoading();
        }
      }
    );
  };

  const handleCancelFunded = async (order: Order) => {
    showConfirm(
      'Cancel Project & Refund Client',
      'Are you sure you want to cancel this project and refund locked funds?',
      async () => {
        if (!address || !order.txHash) return showToast('Missing contract or wallet data', 'error');
        try {
          showLoading('Canceling project and refunding client on-chain...');
          await freelancerCancel(order.txHash, address);

          const newChangelog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            message: 'Project cancelled by freelancer. Remaining locked funds refunded.',
          };

          await updateOrderStatus(order.id, {
            status: 'denied',
            progressPercentage: 100,
            changelogs: [...(order.changelogs || []), newChangelog]
          });
          await createNotification({
            recipientId: order.clientAddress,
            senderId: address!,
            senderName: userProfile?.name || 'Freelancer',
            title: 'Project Cancelled',
            message: `The project was cancelled by the freelancer. Remaining locked funds refunded.`,
            type: 'escrow',
            orderId: order.id,
          });
          showToast('Project cancelled and client refunded successfully!', 'success');
        } catch (e: unknown) {
          showToast(`Refund failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
        } finally {
          hideLoading();
        }
      }
    );
  };

  const handleDisputeProject = async (order: Order) => {
    if (!address || !order.txHash) return showToast('Error: Missing contract or wallet data', 'error');
    try {
      showLoading('Initiating dispute on-chain...');
      await requestMediation(order.txHash, address);

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: 'Dispute initiated by freelancer.',
      };

      await updateOrderStatus(order.id, {
        status: 'disputed',
        changelogs: [...(order.changelogs || []), newChangelog]
      });
      await createNotification({
        recipientId: order.clientAddress,
        senderId: address!,
        senderName: userProfile?.name || 'Freelancer',
        title: 'Dispute Initiated',
        message: `A dispute has been initiated for this project.`,
        type: 'dispute',
        orderId: order.id,
      });
      showToast('Dispute initiated successfully!', 'success');
    } catch (e: unknown) {
      showToast(`Failed to initiate dispute: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      hideLoading();
    }
  };

  const filteredOrders = myOrders.filter(order => {
    if (order.status === 'completed' || order.status === 'denied' || order.status === 'settled_dispute') return false;
    const matchesSearch = order.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'disputed' && (order.status === 'disputed' || order.status === 'mediation')) || 
      order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusOptions = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending Approval', value: 'pending_acceptance' },
    { label: 'Pending Escrow', value: 'awaiting_funding' },
    { label: 'Active Escrow', value: 'escrow_funded' },
    { label: 'Disputed', value: 'disputed' }
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
            <OrderCard
              key={order.id}
              order={order}
              showDenyInput={!!showDenyInput[order.id]}
              denyMsg={denyMsgs[order.id] || ''}
              onDenyMsgChange={(val) => setDenyMsgs(prev => ({ ...prev, [order.id]: val }))}
              onShowDenyInput={(val) => setShowDenyInput(prev => ({ ...prev, [order.id]: val }))}
              onAccept={handleAcceptBooking}
              onDenyConfirm={handleDenyRequest}
              onCancelUnfunded={handleCancelUnfunded}
              onCancelFunded={handleCancelFunded}
              onDispute={handleDisputeProject}
              onViewProposal={setActiveProposalOrder}
              onSubmitDeliverables={setActiveSubmitOrder}
              onDisputePanel={setActiveDisputeOrder}
              onMessage={setActiveChatOrder}
              onViewStatus={setActiveStatusOrder}
              onViewClientProfile={handleViewClientProfile}
              showToast={showToast}
            />
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

      {activeProposalOrder && (
        <ProposalModal
          order={activeProposalOrder}
          onClose={() => setActiveProposalOrder(null)}
        />
      )}

      {activeChatOrder && (
        <ChatModal
          order={activeChatOrder}
          currentAddress={address!}
          onClose={() => setActiveChatOrder(null)}
        />
      )}

      {activeStatusOrder && (
        <StatusModal
          order={activeStatusOrder}
          onClose={() => setActiveStatusOrder(null)}
        />
      )}

      {activeSubmitOrder && (
        <SubmitDeliverableModal
          order={activeSubmitOrder}
          onClose={() => setActiveSubmitOrder(null)}
          onSuccess={() => {
            setActiveSubmitOrder(null);
            showToast('Deliverables successfully submitted for review!', 'success');
          }}
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

      {activeClientProfile && (
        <ProfileModal
          profile={activeClientProfile}
          onClose={() => setActiveClientProfile(null)}
        />
      )}
    </div>
  );
};
