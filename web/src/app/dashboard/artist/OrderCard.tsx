'use client';

import React from 'react';
import { Order } from '@/lib/types';
import { Check, X, Eye, MessageSquare, Activity, UploadCloud, ShieldAlert } from 'lucide-react';
import { UserWalletInfo } from '@/components/ui/UserWalletInfo';
import { DropdownMenu } from '@/components/ui/DropdownMenu';

export interface OrderCardProps {
  order: Order;
  showDenyInput: boolean;
  denyMsg: string;
  onDenyMsgChange: (val: string) => void;
  onShowDenyInput: (val: boolean) => void;
  onAccept: (orderId: string) => void;
  onDenyConfirm: (orderId: string) => void;
  onCancelUnfunded: (order: Order) => void;
  onCancelFunded: (order: Order) => void;
  onDispute: (order: Order) => void;
  onViewProposal: (order: Order) => void;
  onSubmitDeliverables: (order: Order) => void;
  onDisputePanel: (order: Order) => void;
  onMessage: (order: Order) => void;
  onViewStatus: (order: Order) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

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

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  showDenyInput,
  denyMsg,
  onDenyMsgChange,
  onShowDenyInput,
  onAccept,
  onDenyConfirm,
  onCancelUnfunded,
  onCancelFunded,
  onDispute,
  onViewProposal,
  onSubmitDeliverables,
  onDisputePanel,
  onMessage,
  onViewStatus,
  showToast,
}) => {
  const badge = getStatusBadge(order);

  return (
    <div className={`p-6 rounded-xl glass-card border flex flex-col md:flex-row justify-between items-center gap-6 ${
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
          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider font-heading ${badge.classes}`}>
            {badge.text}
          </span>
        </div>
        {showDenyInput ? (
          <div className="w-full space-y-2 max-w-xs">
            <textarea
              value={denyMsg}
              onChange={(e) => onDenyMsgChange(e.target.value)}
              placeholder="Reason for declining (Optional)..."
              className="w-full bg-obsidian border border-white/10 rounded-lg p-2 text-xs text-white resize-none h-16"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => onShowDenyInput(false)} className="px-3 py-1.5 rounded text-gray-400 text-xs hover:text-white cursor-pointer">Cancel</button>
              <button onClick={() => onDenyConfirm(order.id)} className="px-3 py-1.5 rounded bg-hotpink text-white font-bold text-xs cursor-pointer">Confirm Decline</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap justify-end items-center">
            {order.status === 'pending_acceptance' && (
              <>
                <button
                  title="Accept Request"
                  onClick={() => onAccept(order.id)}
                  className="p-2.5 rounded bg-neongreen text-obsidian hover:shadow-[0_0_10px_rgba(57,255,20,0.4)] transition-all cursor-pointer"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  title="Deny Request"
                  onClick={() => onShowDenyInput(true)}
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
                    onClick={() => onSubmitDeliverables(order)}
                    className="p-2.5 rounded border bg-neoncyan border-neoncyan/30 text-obsidian hover:bg-neoncyan/80 shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-5 h-5" />
                  </button>
                )}
                {(order.status === 'disputed' || order.status === 'mediation') && (
                  <button
                    title="Dispute Panel"
                    onClick={() => onDisputePanel(order)}
                    className="p-2.5 rounded transition-colors font-bold text-xs uppercase tracking-wider px-4 py-2 border bg-yellow-500/20 border-yellow-500 text-yellow-500 hover:bg-yellow-500/40 cursor-pointer shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                  >
                    Dispute Panel
                  </button>
                )}
                <button
                  title="Message"
                  onClick={() => onMessage(order)}
                  className="p-2.5 rounded bg-[#141026] border border-white/10 text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  title="View Status"
                  onClick={() => onViewStatus(order)}
                  className="p-2.5 rounded bg-white text-black hover:shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-all cursor-pointer"
                >
                  <Activity className="w-5 h-5" />
                </button>
              </>
            )}

            <DropdownMenu 
              items={[
                ...(order.status === 'pending_acceptance' ? [{
                  label: 'View Proposal',
                  icon: <Eye className="w-4 h-4" />,
                  onClick: () => onViewProposal(order)
                }] : []),
                ...(order.status === 'awaiting_funding' ? [{
                  label: 'Cancel Request',
                  icon: <X className="w-4 h-4" />,
                  destructive: true,
                  onClick: () => onCancelUnfunded(order)
                }] : []),
                ...((order.status === 'escrow_funded' || order.status === 'delivered') ? [
                  {
                    label: 'Cancel Project (Refund)',
                    icon: <X className="w-4 h-4" />,
                    destructive: true,
                    onClick: () => onCancelFunded(order)
                  },
                  {
                    label: 'Dispute Project',
                    icon: <ShieldAlert className="w-4 h-4" />,
                    destructive: true,
                    onClick: () => order.hasSubmittedOnce ? onDispute(order) : showToast('Dispute locked until first submission', 'error')
                  }
                ] : [])
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
};
