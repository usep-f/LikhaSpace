'use client';

import React, { useState } from 'react';
import { Order, Gig } from '@/lib/mockGigs';
import { 
  Eye, Check, X, UploadCloud, MessageSquare, Activity, ExternalLink, ShieldCheck 
} from 'lucide-react';

interface CardHeaderProps {
  status: Order['status'];
  perspective: 'client' | 'freelancer';
}

const CardHeader: React.FC<CardHeaderProps> = ({ status, perspective }) => {
  const isPending = status === 'pending_acceptance';
  const isClient = perspective === 'client';
  const headerText = isPending 
    ? (isClient ? 'New Booking Request' : 'New Request') 
    : (isClient ? 'Active Project' : 'Active Order');

  return (
    <div className="flex items-center gap-3 mb-1">
      <p className={`text-[10px] uppercase font-bold tracking-wider ${isPending ? 'text-neoncyan' : 'text-gray-400'}`}>
        {headerText}
      </p>
      <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[9px] uppercase tracking-wider font-bold">
        {status.replace('_', ' ')}
      </span>
    </div>
  );
};

interface CardBodyProps {
  order: Order & { gigInfo?: Gig };
  perspective: 'client' | 'freelancer';
}

const CardBody: React.FC<CardBodyProps> = ({ order, perspective }) => {
  const isClient = perspective === 'client';
  const nameLabel = isClient ? 'Freelancer' : 'Client';
  const nameVal = isClient
    ? (order.gigInfo?.freelancerName || order.freelancerAddress.slice(0, 6) + '...' + order.freelancerAddress.slice(-4))
    : order.clientName;

  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
        {nameLabel}
      </p>
      <p className="text-sm font-bold text-white flex items-center gap-1">
        {nameVal}
        {isClient && <ShieldCheck className="w-3.5 h-3.5 text-neongreen" />}
      </p>
      {isClient && order.gigInfo?.title && (
        <p className="text-xs text-gray-400 mt-1">{order.gigInfo.title}</p>
      )}
      <p className="text-xs text-gray-400 mt-1">
        Total: ${order.priceUSD} • Upfront: {order.upfrontPercentage}%
      </p>
    </div>
  );
};

interface DeclineFormProps {
  denyMsg: string;
  onChange: (val: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeclineForm: React.FC<DeclineFormProps> = ({ denyMsg, onChange, onCancel, onConfirm }) => (
  <div className="w-full space-y-2">
    <textarea
      value={denyMsg}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Reason for declining (Optional)..."
      className="w-full bg-obsidian border border-white/10 rounded-lg p-2 text-xs text-white resize-none h-16 focus:outline-none focus:ring-1 focus:ring-hotpink"
    />
    <div className="flex justify-end gap-2">
      <button
        onClick={onCancel}
        className="px-3 py-1.5 rounded text-gray-400 text-xs hover:text-white cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="px-3 py-1.5 rounded bg-hotpink text-white font-bold text-xs cursor-pointer hover:bg-pink-600 transition-colors focus-visible:ring-2 focus-visible:ring-hotpink focus-visible:outline-none"
      >
        Confirm Decline
      </button>
    </div>
  </div>
);

const ViewProposalBtn: React.FC<{ order: Order; onClick: (order: Order) => void }> = ({ order, onClick }) => (
  <button
    onClick={() => onClick(order)}
    title="View Proposal"
    className="p-2.5 rounded bg-neoncyan/10 border border-neoncyan/30 text-neoncyan font-heading font-bold text-xs hover:bg-neoncyan/20 transition-all flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-neoncyan focus-visible:outline-none"
  >
    <Eye className="w-4 h-4" />
  </button>
);

const AcceptBookingBtn: React.FC<{ orderId: string; onClick: (orderId: string) => void }> = ({ orderId, onClick }) => (
  <button
    onClick={() => onClick(orderId)}
    title="Accept Booking"
    className="p-2.5 rounded bg-neongreen text-obsidian font-heading font-bold text-xs hover:shadow-[0_0_10px_rgba(57,255,20,0.4)] transition-all flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-neongreen focus-visible:outline-none"
  >
    <Check className="w-4 h-4" />
  </button>
);

const DenyRequestBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    title="Deny Request"
    className="p-2.5 rounded bg-white/5 text-white font-heading font-bold text-xs hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
  >
    <X className="w-4 h-4" />
  </button>
);

const SubmitDeliverablesBtn: React.FC<{ order: Order; onClick: (order: Order) => void }> = ({ order, onClick }) => (
  <button
    onClick={() => onClick(order)}
    title="Submit Deliverables"
    className="p-2.5 rounded bg-neoncyan border border-neoncyan/30 text-obsidian font-heading font-bold text-xs hover:bg-neoncyan/80 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,255,255,0.4)] flex items-center focus-visible:ring-2 focus-visible:ring-neoncyan focus-visible:outline-none"
  >
    <UploadCloud className="w-4 h-4" />
  </button>
);

const RefundClientBtn: React.FC<{ order: Order; onClick: (order: Order) => void }> = ({ order, onClick }) => (
  <button
    onClick={() => onClick(order)}
    title="Refund Client"
    className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-500 font-heading font-bold text-xs hover:bg-red-500/20 transition-all cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
  >
    <X className="w-4 h-4" />
  </button>
);

const MessageBtn: React.FC<{ order: Order; title: string; onClick: (order: Order) => void }> = ({ order, title, onClick }) => (
  <button
    onClick={() => onClick(order)}
    title={title}
    className="p-2.5 rounded bg-[#141026] border border-white/10 text-white font-heading font-bold text-xs hover:bg-white/5 transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-hotpink focus-visible:outline-none"
  >
    <MessageSquare className="w-4 h-4" />
  </button>
);

const ViewStatusBtn: React.FC<{ order: Order; onClick: (order: Order) => void }> = ({ order, onClick }) => (
  <button
    onClick={() => onClick(order)}
    title="View Status"
    className="p-2.5 rounded bg-white text-black font-heading font-bold text-xs hover:shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
  >
    <Activity className="w-4 h-4" />
  </button>
);

const FundEscrowBtn: React.FC<{ order: Order; onClick: (order: Order) => void }> = ({ order, onClick }) => (
  <button
    onClick={() => onClick(order)}
    title="Fund Escrow"
    className="p-2.5 rounded bg-[#ff00ff]/20 border border-[#ff00ff] text-[#ff00ff] font-heading font-bold text-xs hover:bg-[#ff00ff]/40 transition-colors flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(255,0,255,0.3)] focus-visible:ring-2 focus-visible:ring-[#ff00ff] focus-visible:outline-none"
  >
    <Activity className="w-4 h-4" />
  </button>
);

const ViewDeliverablesBtn: React.FC<{ order: Order; onClick: (order: Order) => void }> = ({ order, onClick }) => (
  <button
    onClick={() => onClick(order)}
    title="View Deliverables"
    className="p-2.5 rounded bg-[#001a1a]/40 border border-[#00ffff]/30 text-[#00ffff] font-heading font-bold text-xs hover:bg-[#001a1a]/60 transition-all flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-neoncyan focus-visible:outline-none"
  >
    <ExternalLink className="w-4 h-4" />
  </button>
);

const CancelOrderBtn: React.FC<{ orderId: string; onClick: (orderId: string) => void }> = ({ orderId, onClick }) => (
  <button
    onClick={() => onClick(orderId)}
    title="Cancel Order"
    className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-500 font-heading font-bold text-xs hover:bg-red-500/20 transition-all flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
  >
    <X className="w-4 h-4" />
  </button>
);

const ClaimRefundBtn: React.FC<{ order: Order; onClick: (order: Order) => void }> = ({ order, onClick }) => (
  <button
    onClick={() => onClick(order)}
    title="Claim Timeout Refund"
    className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-500 font-heading font-bold text-xs hover:bg-red-500/20 transition-all flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
  >
    <X className="w-4 h-4" />
  </button>
);

interface FreelancerActionsProps {
  order: Order;
  onViewProposal?: (order: Order) => void;
  onAcceptBooking?: (orderId: string) => void;
  onDenyClick: () => void;
  onSubmitDeliverables?: (order: Order) => void;
  onRefundClient?: (order: Order) => void;
  onMessage?: (order: Order) => void;
  onViewStatus?: (order: Order) => void;
}

const FreelancerActions: React.FC<FreelancerActionsProps> = ({
  order,
  onViewProposal,
  onAcceptBooking,
  onDenyClick,
  onSubmitDeliverables,
  onRefundClient,
  onMessage,
  onViewStatus,
}) => {
  const isPending = order.status === 'pending_acceptance';
  const isFunded = order.status === 'escrow_funded';

  return (
    <div className="flex gap-2 flex-wrap justify-end">
      {isPending && onViewProposal && <ViewProposalBtn order={order} onClick={onViewProposal} />}
      {isPending && onAcceptBooking && <AcceptBookingBtn orderId={order.id} onClick={onAcceptBooking} />}
      {isPending && <DenyRequestBtn onClick={onDenyClick} />}
      {isFunded && onSubmitDeliverables && <SubmitDeliverablesBtn order={order} onClick={onSubmitDeliverables} />}
      {isFunded && onRefundClient && <RefundClientBtn order={order} onClick={onRefundClient} />}
      {!isPending && onMessage && <MessageBtn order={order} title="Message Client" onClick={onMessage} />}
      {!isPending && onViewStatus && <ViewStatusBtn order={order} onClick={onViewStatus} />}
    </div>
  );
};

interface ClientActionsProps {
  order: Order;
  onFundEscrow?: (order: Order) => void;
  onMessage?: (order: Order) => void;
  onViewDeliverables?: (order: Order) => void;
  onViewStatus?: (order: Order) => void;
  onCancelOrder?: (orderId: string) => void;
  onClaimRefund?: (order: Order) => void;
}

const ClientActions: React.FC<ClientActionsProps> = ({
  order,
  onFundEscrow,
  onMessage,
  onViewDeliverables,
  onViewStatus,
  onCancelOrder,
  onClaimRefund,
}) => {
  const isPending = order.status === 'pending_acceptance';
  const isAwaiting = order.status === 'awaiting_funding';
  const isFunded = order.status === 'escrow_funded';

  return (
    <div className="flex gap-2 flex-wrap justify-end">
      {isAwaiting && onFundEscrow && <FundEscrowBtn order={order} onClick={onFundEscrow} />}
      {isClientCancelable(order.status) && onCancelOrder && (
        <CancelOrderBtn orderId={order.id} onClick={onCancelOrder} />
      )}
      {isFunded && onClaimRefund && <ClaimRefundBtn order={order} onClick={onClaimRefund} />}
      {!isPending && !isAwaiting && (
        <>
          {onViewDeliverables && <ViewDeliverablesBtn order={order} onClick={onViewDeliverables} />}
          {onMessage && <MessageBtn order={order} title="Message Freelancer" onClick={onMessage} />}
          {onViewStatus && <ViewStatusBtn order={order} onClick={onViewStatus} />}
        </>
      )}
    </div>
  );
};

function isClientCancelable(status: Order['status']): boolean {
  return status === 'pending_acceptance' || status === 'awaiting_funding';
}

interface CardActionsProps extends Omit<ProjectCardProps, 'perspective'> {
  perspective: 'client' | 'freelancer';
  showDeny: boolean;
  denyMsg: string;
  setDenyMsg: (v: string) => void;
  setShowDeny: (v: boolean) => void;
  onDeclineConfirm: () => void;
}

const CardActions: React.FC<CardActionsProps> = ({
  order,
  perspective,
  showDeny,
  denyMsg,
  setDenyMsg,
  setShowDeny,
  onDeclineConfirm,
  ...handlers
}) => {
  if (showDeny) {
    return (
      <DeclineForm
        denyMsg={denyMsg}
        onChange={setDenyMsg}
        onCancel={() => setShowDeny(false)}
        onConfirm={onDeclineConfirm}
      />
    );
  }
  return perspective === 'freelancer'
    ? <FreelancerActions order={order} {...handlers} onDenyClick={() => setShowDeny(true)} />
    : <ClientActions order={order} {...handlers} />;
};

export interface ProjectCardProps {
  order: Order & { gigInfo?: Gig };
  perspective: 'client' | 'freelancer';
  onViewProposal?: (order: Order) => void;
  onAcceptBooking?: (orderId: string) => void;
  onConfirmDecline?: (orderId: string, reason: string) => void;
  onFundEscrow?: (order: Order) => void;
  onMessage?: (order: Order) => void;
  onViewDeliverables?: (order: Order) => void;
  onSubmitDeliverables?: (order: Order) => void;
  onRefundClient?: (order: Order) => void;
  onClaimRefund?: (order: Order) => void;
  onCancelOrder?: (orderId: string) => void;
  onViewStatus?: (order: Order) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  order,
  perspective,
  ...handlers
}) => {
  const [showDeny, setShowDeny] = useState(false);
  const [denyMsg, setDenyMsg] = useState('');

  const handleDeclineConfirm = () => {
    if (handlers.onConfirmDecline) {
      handlers.onConfirmDecline(order.id, denyMsg);
    }
    setShowDeny(false);
  };

  const borderClass = order.status === 'pending_acceptance'
    ? 'border-neoncyan/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]'
    : 'border-white/5';

  return (
    <div className={`p-6 rounded-xl glass-card border flex flex-col md:flex-row justify-between items-center gap-6 ${borderClass}`}>
      <div className="flex-1 w-full">
        <CardHeader status={order.status} perspective={perspective} />
        <CardBody order={order} perspective={perspective} />
      </div>
      <div className="flex-1 w-full flex justify-end">
        <CardActions
          order={order}
          perspective={perspective}
          showDeny={showDeny}
          denyMsg={denyMsg}
          setDenyMsg={setDenyMsg}
          setShowDeny={setShowDeny}
          onDeclineConfirm={handleDeclineConfirm}
          {...handlers}
        />
      </div>
    </div>
  );
};
