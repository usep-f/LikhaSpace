import React, { useState } from 'react';
import { Order } from '@/lib/mockGigs';
import { X, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';

interface DeliverablesModalProps {
  order: Order;
  onClose: () => void;
  onApprove: (orderId: string) => void;
  onDeny: (orderId: string, reason: string) => void;
}

export const DeliverablesModal: React.FC<DeliverablesModalProps> = ({ order, onClose, onApprove, onDeny }) => {
  const [showDeny, setShowDeny] = useState(false);
  const [denyReason, setDenyReason] = useState('');

  const hasDeliverables = order.deliverablesLink || order.deliverableNotes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-violet-dark border border-white/10 rounded-2xl shadow-2xl p-6">

        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <h2 className="text-xl font-heading font-bold text-white">Review Deliverables</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!hasDeliverables ? (
          <div className="py-8 text-center">
            <p className="text-gray-400 text-sm">The freelancer hasn&apos;t submitted any deliverables yet.</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Link & Notes */}
            <div className="bg-obsidian border border-white/5 rounded-xl p-4 space-y-4">
              {order.deliverablesLink && (
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Project Link</p>
                  <a
                    href={order.deliverablesLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-neoncyan hover:underline break-all"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    {order.deliverablesLink}
                  </a>
                </div>
              )}

              {order.deliverableNotes && (
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Freelancer Notes</p>
                  <p className="text-xs text-gray-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                    &quot;{order.deliverableNotes}&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Action Area */}
            {order.status === 'delivered' && (
              <div className="pt-4 border-t border-white/5">
                {!showDeny ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => onApprove(order.id)}
                      className="flex-1 py-2.5 rounded-lg bg-neongreen text-obsidian font-heading font-bold text-xs uppercase hover:shadow-[0_0_15px_rgba(57,255,20,0.4)] transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve & Release Escrow
                    </button>
                    <button
                      onClick={() => setShowDeny(true)}
                      className="px-6 py-2.5 rounded-lg bg-hotpink/10 border border-hotpink/50 text-hotpink font-heading font-bold text-xs uppercase hover:bg-hotpink/20 transition-all flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" /> Deny
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-hotpink">Reason for Denial</label>
                    <textarea
                      value={denyReason}
                      onChange={(e) => setDenyReason(e.target.value)}
                      placeholder="Explain what needs to be changed..."
                      className="w-full bg-obsidian border border-hotpink/30 rounded-lg p-3 text-xs text-white resize-none h-24 focus:outline-none focus:border-hotpink"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowDeny(false)} className="px-4 py-2 rounded text-gray-400 text-xs hover:text-white transition-colors">Cancel</button>
                      <button
                        onClick={() => onDeny(order.id, denyReason)}
                        className="px-4 py-2 rounded bg-hotpink text-white font-bold text-xs hover:shadow-[0_0_10px_rgba(255,0,127,0.4)] transition-all"
                      >
                        Submit Denial
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {order.status === 'completed' && (
              <p className="text-center text-xs text-neongreen font-bold uppercase tracking-wider py-2">
                Order Completed & Escrow Released
              </p>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
