'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useNotification } from '@/context/NotificationContext';
import { Sparkles, PlusCircle, Check, X, Eye, MessageSquare, Activity, UploadCloud, ShieldAlert } from 'lucide-react';
import { Order, Gig, FreelancerProfile } from '@/lib/types';
import { Pagination } from '@/components/Pagination';
import { DashboardSearch } from '@/components/DashboardSearch';
import { subscribeToFreelancerOrders, updateOrderStatus, createGig, getFreelancerGigs, getUserProfile, getFreelancerOrders } from '@/lib/db';
import { ProposalModal } from '@/components/ProposalModal';
import { ListingModal } from '@/components/ListingModal';
import { ChatModal } from '@/components/ChatModal';
import { StatusModal } from '@/components/StatusModal';
import { SubmitDeliverableModal } from '@/components/SubmitDeliverableModal';
import { DisputeModal } from '@/components/DisputeModal';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { UserWalletInfo } from '@/components/ui/UserWalletInfo';
import { freelancerCancel, cancelUnfunded, requestMediation, getFreelancerReputation, ReputationData } from '@/lib/contract';
import { profileSettingsSchema, denialMessageSchema, sanitizeInput } from '@/lib/validation';

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
  const { address } = useWallet();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const { showToast, showLoading, hideLoading } = useNotification();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Listing Modal State
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);

  const loadGigs = React.useCallback(async () => {
    if (!address) return;
    try {
      const res = await getFreelancerGigs(address);
      setGigs(res);
    } catch (err) {
      console.error('Failed to load gigs:', err);
    }
  }, [address]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadGigs();
  }, [loadGigs]);

  const filteredGigs = gigs.filter(gig => {
    const matchesSearch = gig.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || gig.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredGigs.length / itemsPerPage);
  const paginatedGigs = filteredGigs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusOptions = [
    { label: 'All Listings', value: 'all' },
    { label: 'Live (Available)', value: 'active' },
    { label: 'Occupied (Hidden)', value: 'occupied' },
    { label: 'Paused (Hidden)', value: 'paused' }
  ];

  const handleCreateNew = () => {
    setEditingGig(null);
    setIsListingModalOpen(true);
  };

  const handleEdit = (gig: Gig) => {
    setEditingGig(gig);
    setIsListingModalOpen(true);
  };

  const handleSaveListing = async (updatedGig: Partial<Gig>) => {
    if (!address) return showToast('Wallet not connected', 'error');
    try {
      showLoading('Saving service listing...');
      const profile = await getUserProfile(address);
      const freelancerName = profile?.name || 'Freelancer';

      const gigId = editingGig?.id || crypto.randomUUID();
      const gig: Gig = {
        id: gigId,
        freelancerAddress: address,
        freelancerName,
        title: updatedGig.title || '',
        category: updatedGig.category || 'design',
        description: updatedGig.description || '',
        priceUSD: updatedGig.priceUSD || 100,
        tags: updatedGig.tags || [],
        status: updatedGig.status || 'active',
        milestones: updatedGig.milestones || [],
      };
      await createGig(gig);
      await loadGigs();
      showToast('Listing saved successfully!', 'success');
      setIsListingModalOpen(false);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      showToast(`Failed to save listing: ${msg}`, 'error');
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-bold text-lg text-white">My Services</h3>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-hotpink text-white font-heading text-[10px] font-bold border border-hotpink/30 hover:shadow-[0_0_8px_rgba(255,0,127,0.3)] transition-all cursor-pointer"
        >
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
                     gig.status === 'active' ? 'bg-neongreen/10 text-neongreen' :
                     gig.status === 'paused' ? 'bg-gray-500/10 text-gray-400' : 'bg-white/10 text-white'
                   }`}>
                     {gig.status === 'active' ? 'Live' : gig.status === 'paused' ? 'Paused' : 'Occupied (Hidden)'}
                   </span>
                 </div>
                 <p className="font-bold text-white text-sm leading-tight pr-4">{gig.title}</p>
                 <p className="text-xs text-hotpink font-bold mt-1">${gig.priceUSD} USD</p>
               </div>
               <div className="flex gap-2">
                 <button
                   onClick={() => handleEdit(gig)}
                   className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                 >
                   Edit
                 </button>
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

      {isListingModalOpen && (
        <ListingModal
          gig={editingGig}
          onClose={() => setIsListingModalOpen(false)}
          onSave={handleSaveListing}
        />
      )}
    </div>
  );
};

// Orders View
const OrdersView: React.FC = () => {
  const { address } = useWallet();
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  React.useEffect(() => {
    if (!address) return;
    const unsubscribe = subscribeToFreelancerOrders(address, (orders) => {
      setMyOrders(orders);
    });
    return () => unsubscribe();
  }, [address]);
  const { showToast, showConfirm, showLoading, hideLoading } = useNotification();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Active decline interaction state mapping (orderId -> boolean)
  const [showDenyInput, setShowDenyInput] = useState<Record<string, boolean>>({});
  const [denyMsgs, setDenyMsgs] = useState<Record<string, string>>({});

  // Modal State
  const [activeProposalOrder, setActiveProposalOrder] = useState<Order | null>(null);
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [activeStatusOrder, setActiveStatusOrder] = useState<Order | null>(null);
  const [activeSubmitOrder, setActiveSubmitOrder] = useState<Order | null>(null);
  const [activeDisputeOrder, setActiveDisputeOrder] = useState<Order | null>(null);

  const filteredOrders = myOrders.filter(order => {
    if (order.status === 'completed' || order.status === 'denied' || order.status === 'settled_dispute') return false;
    const matchesSearch = order.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'disputed' && (order.status === 'disputed' || order.status === 'mediation')) || 
      order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      
      // Zod Validation & Sanitization
      const parsed = denialMessageSchema.safeParse({ message: msg });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message);
      }
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
      setShowDenyInput({ ...showDenyInput, [orderId]: false });
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
          if (order.txHash) {
            await cancelUnfunded(order.txHash, address);
          }

          const newChangelog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            message: 'Booking request cancelled by freelancer before funding.',
          };

          await updateOrderStatus(order.id, {
            status: 'denied',
            changelogs: [...(order.changelogs || []), newChangelog]
          });

          showToast('Booking request cancelled successfully!', 'success');
        } catch (e: unknown) {
          console.error(e);
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
      'Are you sure you want to cancel this project and refund all remaining locked funds to the client? Any completed milestone payouts already in your wallet will be kept, but you will forfeit the active milestone and future milestones.',
      async () => {
        if (!address || !order.txHash) return showToast('Missing contract or wallet data', 'error');
        try {
          showLoading('Canceling project and refunding client on-chain...');
          await freelancerCancel(order.txHash, address);

          const newChangelog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            message: 'Project cancelled by freelancer. All remaining locked funds refunded to client.',
          };

          await updateOrderStatus(order.id, {
            status: 'denied',
            progressPercentage: 100,
            changelogs: [...(order.changelogs || []), newChangelog]
          });

          showToast('Project cancelled and client refunded successfully!', 'success');
        } catch (e: unknown) {
          console.error(e);
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

      showToast('Dispute initiated successfully!', 'success');
    } catch (e: unknown) {
      console.error(e);
      showToast(`Failed to initiate dispute: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      hideLoading();
    }
  };

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
            <div key={order.id} className={`p-6 rounded-xl glass-card border flex flex-col md:flex-row justify-between items-center gap-6 ${
              order.status === 'pending_acceptance' ? 'border-neoncyan/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]' :
              order.status === 'delivered' ? 'border-neongreen/20' :
              'border-white/5'
            }`}>
               <div className="flex-1 w-full">
                 <div className="flex items-center gap-3 mb-1">
                   <p className={`text-[10px] uppercase font-bold tracking-wider ${
                     order.status === 'pending_acceptance' ? 'text-neoncyan' : 'text-gray-400'
                   }`}>
                     {order.status === 'pending_acceptance' ? 'New Request' : 'Active Order'}
                   </p>
                 </div>
                 <UserWalletInfo
                   address={order.clientAddress}
                   role="client"
                   fallbackName={order.clientName}
                   className="mb-1"
                 />
                 <p className="text-xs text-gray-400 mt-1">Total: ${order.priceUSD} USD</p>
               </div>

               <div className="flex-1 w-full flex flex-col justify-end items-end gap-2">
                 <div className="mb-1">
                   <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider font-heading ${getStatusBadge(order).classes}`}>
                     {getStatusBadge(order).text}
                   </span>
                 </div>
                 {showDenyInput[order.id] ? (
                    <div className="w-full space-y-2 max-w-xs">
                      <textarea
                        value={denyMsgs[order.id] || ''}
                        onChange={(e) => setDenyMsgs({ ...denyMsgs, [order.id]: e.target.value })}
                        placeholder="Reason for declining (Optional)..."
                        className="w-full bg-obsidian border border-white/10 rounded-lg p-2 text-xs text-white resize-none h-16"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowDenyInput({ ...showDenyInput, [order.id]: false })} className="px-3 py-1.5 rounded text-gray-400 text-xs hover:text-white cursor-pointer">Cancel</button>
                        <button onClick={() => handleDenyRequest(order.id)} className="px-3 py-1.5 rounded bg-hotpink text-white font-bold text-xs cursor-pointer">Confirm Decline</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap justify-end items-center">
                      {order.status === 'pending_acceptance' && (
                        <>
                          <button
                            title="Accept Request"
                            onClick={() => handleAcceptBooking(order.id)}
                            className="p-2.5 rounded bg-neongreen text-obsidian hover:shadow-[0_0_10px_rgba(57,255,20,0.4)] transition-all cursor-pointer"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            title="Deny Request"
                            onClick={() => setShowDenyInput({ ...showDenyInput, [order.id]: true })}
                            className="p-2.5 rounded bg-red-500/20 border border-red-500 text-red-500 hover:bg-red-500/40 transition-colors cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {order.status !== 'pending_acceptance' && (
                        <>
                          {order.status === 'escrow_funded' && (
                            <button
                              title="Submit Deliverables"
                              onClick={() => setActiveSubmitOrder(order)}
                              className="p-2.5 rounded border bg-neoncyan border-neoncyan/30 text-obsidian hover:bg-neoncyan/80 shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all cursor-pointer"
                            >
                              <UploadCloud className="w-5 h-5" />
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

                      {/* Dropdown Menu for Secondary/Destructive Actions */}
                      <DropdownMenu 
                        items={[
                          ...(order.status === 'pending_acceptance' ? [{
                            label: 'View Proposal',
                            icon: <Eye className="w-4 h-4" />,
                            onClick: () => setActiveProposalOrder(order)
                          }] : []),
                          ...(order.status === 'awaiting_funding' ? [{
                            label: 'Cancel Request',
                            icon: <X className="w-4 h-4" />,
                            destructive: true,
                            onClick: () => handleCancelUnfunded(order)
                          }] : []),
                          ...((order.status === 'escrow_funded' || order.status === 'delivered') ? [
                            {
                              label: 'Cancel Project (Refund)',
                              icon: <X className="w-4 h-4" />,
                              destructive: true,
                              onClick: () => handleCancelFunded(order)
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
    </div>
  );
};

// History View
const HistoryView: React.FC = () => {
  const { address } = useWallet();
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  React.useEffect(() => {
    if (!address) return;
    getFreelancerOrders(address)
      .then(orders => {
        setCompletedOrders(orders.filter(o => o.status === 'completed' || o.status === 'denied' || o.status === 'settled_dispute'));
      })
      .catch(console.error);
  }, [address]);

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-bold text-lg text-white">Transaction History</h3>
      <div className="space-y-4">
        {completedOrders.length > 0 ? (
          completedOrders.map(order => (
            <div key={order.id} className="p-6 rounded-xl glass-card border border-white/5 flex flex-col gap-4">
               <div className="flex justify-between items-start">
                 <div>
                   <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${
                     order.status === 'completed' ? 'text-green-400' : 
                     order.status === 'settled_dispute' ? 'text-yellow-500' : 'text-red-400'
                   }`}>
                     {order.status === 'completed' ? 'Completed Order' : 
                      order.status === 'settled_dispute' ? 'Settled Dispute' : 'Cancelled Order'}
                   </p>
                   <UserWalletInfo
                     address={order.clientAddress}
                     role="client"
                     fallbackName={order.clientName}
                     className="mb-1"
                   />
                   <p className="text-xs text-gray-400 mt-1">Total: ${order.priceUSD} USD</p>
                 </div>
                 <div className="text-right">
                   {order.txHash && (
                     <p className="text-[10px] text-gray-500 font-mono mt-1">Tx: {order.txHash.slice(0, 16)}...</p>
                   )}
                 </div>
               </div>
               
               {order.review && (
                 <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                   <div className="flex items-center gap-1 mb-1">
                     {[...Array(5)].map((_, i) => (
                       <Sparkles key={i} className={`w-3 h-3 ${i < order.review!.rating ? 'text-yellow-400' : 'text-gray-600'}`} />
                     ))}
                   </div>
                   <p className="text-xs text-gray-300 italic">&quot;{order.review.text}&quot;</p>
                 </div>
               )}
            </div>
          ))
        ) : (
          <div className="py-12 text-center border border-white/5 rounded-xl glass-card">
            <p className="text-sm text-gray-400">No completed history found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Profile Settings View
const ProfileSettingsView: React.FC = () => {
  const { userProfile, registerProfile, deleteProfile } = useWallet();
  const { showToast, showConfirm, showLoading, hideLoading } = useNotification();
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    title: userProfile?.title || '',
    bio: userProfile?.bio || '',
    category: userProfile?.category || '',
    careerPath: userProfile?.careerPath || '',
    github: userProfile?.github || '',
    linkedin: userProfile?.linkedin || '',
    twitter: userProfile?.twitter || '',
    portfolio: userProfile?.portfolio || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const parsed = profileSettingsSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      showToast('Please fix the errors in the form.', 'error');
      return;
    }

    try {
      showLoading('Saving profile...');
      const sanitizedData = {
        ...parsed.data,
        bio: sanitizeInput(parsed.data.bio || ''),
        title: sanitizeInput(parsed.data.title || ''),
        name: sanitizeInput(parsed.data.name),
      };
      await registerProfile(sanitizedData);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile.', 'error');
    } finally {
      hideLoading();
    }
  };

  const handleDelete = () => {
    showConfirm(
      'Delete Account',
      'Are you sure you want to completely delete your account? Your personal data will be erased, but your on-chain transactions will remain safely recorded on the Stellar network under your wallet address.',
      async () => {
        try {
          showLoading('Deleting account...');
          await deleteProfile();
          window.location.href = '/';
        } catch {
          hideLoading();
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h3 className="font-heading font-bold text-lg text-white">Profile Settings</h3>
      <form onSubmit={handleSave} className="space-y-4 p-6 glass-card rounded-xl border border-white/5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
          <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink" />
          {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Professional Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink" />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
          <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-hotpink" />
          {errors.bio && <p className="text-red-400 text-xs mt-1">{errors.bio}</p>}
        </div>
        <div className="flex justify-between pt-4 mt-4 border-t border-white/5">
          <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-500/10 text-red-400 font-bold text-sm rounded hover:bg-red-500/20 transition-colors">
            Delete Account
          </button>
          <button type="submit" className="px-6 py-2 bg-hotpink text-white font-bold text-sm rounded hover:bg-pink-600 transition-colors">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default function ArtistDashboard() {
  const { isConnected, address } = useWallet();
  const [activeTab, setActiveTab] = useState('listings');
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [onChainReputation, setOnChainReputation] = useState<ReputationData | null>(null);

  React.useEffect(() => {
    if (!address) return;
    getUserProfile(address)
      .then((p) => {
        if (p) {
          setProfile({
            address,
            name: p.name || 'Anonymous',
            title: p.title || '',
            bio: p.bio || '',
            totalEarnedXLM: p.totalEarnedXLM || 0,
            projectsCompleted: p.projectsCompleted || 0,
            averageRating: p.averageRating || 5.0,
            testimonials: p.testimonials || [],
          });
        } else {
          setProfile(null);
        }
      })
      .catch(console.error);

    getFreelancerReputation(address)
      .then((rep) => {
        setOnChainReputation(rep);
      })
      .catch(console.error);
  }, [address]);

  // Calculate dynamic stats
  const completed = onChainReputation ? onChainReputation.projectsCompleted : (profile?.projectsCompleted || 0);
  const totalEarned = onChainReputation ? Number(onChainReputation.totalEarnedStroops) / 10000000 : (profile?.totalEarnedXLM || 0);

  // Check if there are any reviews in either database or on-chain
  const hasOnChainReviews = onChainReputation && onChainReputation.ratingCount > 0;
  const hasDbReviews = profile && profile.testimonials && profile.testimonials.length > 0;
  
  const ratingValue = hasOnChainReviews
    ? onChainReputation.ratingSum / onChainReputation.ratingCount
    : (hasDbReviews ? profile.averageRating : null);

  const ratingText = ratingValue !== null ? `${ratingValue.toFixed(1)} Rating` : 'No Reviews';

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
        <ReputationStatCard label="Total XLM Earned" value={`${totalEarned.toLocaleString()} XLM`} colorClass="text-glow-green text-neongreen" />
        <ReputationStatCard label="Gigs Completed" value={`${completed} Projects`} colorClass="text-glow-pink text-hotpink" />
        <ReputationStatCard label="On-Chain Reputation" value={ratingText} colorClass="text-glow-cyan text-neoncyan" />
      </div>

      <div className="mt-8">
        <DashboardTabs active={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'listings' && <ListingsView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'profile' && <ProfileSettingsView />}
        {activeTab === 'history' && <HistoryView />}
      </div>
    </div>
  );
}
