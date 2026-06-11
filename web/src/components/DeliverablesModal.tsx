import React, { useState, useEffect } from 'react';
import { Order, MilestoneConfig } from '@/lib/mockGigs';
import { X, ExternalLink, CheckCircle, AlertTriangle, Download, DollarSign } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';

interface DeliverablesModalProps {
  order: Order;
  onClose: () => void;
  onApprove: (orderId: string) => void;
  onDeny: (orderId: string, reason: string) => void;
  onPayRevision?: (orderId: string, reason: string) => void;
}

export const DeliverablesModal: React.FC<DeliverablesModalProps> = ({ order, onClose, onApprove, onDeny, onPayRevision }) => {
  const [showDeny, setShowDeny] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const currentIdx = order.currentMilestoneIdx || 0;
  const milestone: MilestoneConfig | undefined = order.milestones?.[currentIdx];
  const isCompleted = order.status === 'completed';

  const title = milestone ? `Review Milestone: ${milestone.title}` : 'Review Deliverables';
  
  const link = milestone?.deliverablesLink || order.deliverablesLink;
  const notes = milestone?.deliverableNotes || order.deliverableNotes;
  const storagePath = milestone?.deliverablesStoragePath;
  const fileName = milestone?.deliverablesFileName;

  const hasDeliverables = link || notes || storagePath;
  const revisionsUsed = milestone?.revisionsUsed || 0;
  const maxRevisions = milestone?.maxRevisions || 0;
  const outOfRevisions = revisionsUsed >= maxRevisions;

  useEffect(() => {
    if (storagePath) {
      const fileRef = ref(storage, storagePath);
      getDownloadURL(fileRef)
        .then(url => setDownloadUrl(url))
        .catch(err => console.error("Error getting download URL", err));
    }
  }, [storagePath]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-violet-dark border border-white/10 rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-white">{title}</h2>
            {milestone && (
              <p className="text-xs text-gray-400 mt-1">Revisions used: {revisionsUsed} / {maxRevisions}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors self-start">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!hasDeliverables && !isCompleted ? (
          <div className="py-8 text-center">
            <p className="text-gray-400 text-sm">The freelancer hasn&apos;t submitted any deliverables for this milestone yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-obsidian border border-white/5 rounded-xl p-4 space-y-4">
              {link && (
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Project Link</p>
                  <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-neoncyan hover:underline break-all">
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    {link}
                  </a>
                </div>
              )}

              {storagePath && (
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Attached File</p>
                  {downloadUrl ? (
                    <a href={downloadUrl} target="_blank" rel="noreferrer" download className="flex items-center gap-2 text-sm text-white hover:text-neoncyan transition-colors break-all">
                      <Download className="w-4 h-4 shrink-0 text-neoncyan" />
                      {fileName || 'Download File'}
                    </a>
                  ) : (
                    <p className="text-xs text-gray-400">Loading file...</p>
                  )}
                </div>
              )}

              {notes && (
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Freelancer Notes</p>
                  <p className="text-xs text-gray-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                    &quot;{notes}&quot;
                  </p>
                </div>
              )}
            </div>

            {(!isCompleted && (order.status === 'delivered' || milestone?.state === 'submitted')) && (
              <div className="pt-4 border-t border-white/5">
                {!showDeny ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <button onClick={() => onApprove(order.id)} className="flex-1 py-2.5 rounded-lg bg-neongreen text-obsidian font-heading font-bold text-xs uppercase hover:shadow-[0_0_15px_rgba(57,255,20,0.4)] transition-all flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Approve Milestone
                      </button>
                      <button onClick={() => setShowDeny(true)} className="px-6 py-2.5 rounded-lg bg-hotpink/10 border border-hotpink/50 text-hotpink font-heading font-bold text-xs uppercase hover:bg-hotpink/20 transition-all flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Deny
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-hotpink">Reason for Denial</label>
                    {outOfRevisions && (
                       <p className="text-xs text-yellow-500 mb-2">Warning: The freelancer has used all revisions. You must pay for an additional revision to request changes.</p>
                    )}
                    <textarea
                      value={denyReason}
                      onChange={(e) => setDenyReason(e.target.value)}
                      placeholder="Explain what needs to be changed..."
                      className="w-full bg-obsidian border border-hotpink/30 rounded-lg p-3 text-xs text-white resize-none h-24 focus:outline-none focus:border-hotpink"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowDeny(false)} className="px-4 py-2 rounded text-gray-400 text-xs hover:text-white transition-colors cursor-pointer">Cancel</button>
                      
                      {outOfRevisions ? (
                        <button
                          disabled={!denyReason.trim()}
                          onClick={() => {
                            setShowDeny(false);
                            if (onPayRevision) onPayRevision(order.id, denyReason);
                          }}
                          className={`px-4 py-2 rounded font-bold text-xs flex items-center gap-2 transition-all duration-200 ${
                            denyReason.trim()
                              ? 'bg-yellow-500 text-obsidian hover:shadow-[0_0_10px_rgba(234,179,8,0.4)] cursor-pointer'
                              : 'bg-yellow-500/50 text-obsidian/50 cursor-not-allowed'
                          }`}
                        >
                          <DollarSign className="w-4 h-4" /> Pay & Deny
                        </button>
                      ) : (
                        <button
                          disabled={!denyReason.trim()}
                          onClick={() => onDeny(order.id, denyReason)}
                          className={`px-4 py-2 rounded font-bold text-xs transition-all duration-200 ${
                            denyReason.trim()
                              ? 'bg-hotpink text-white hover:shadow-[0_0_10px_rgba(255,0,127,0.4)] cursor-pointer'
                              : 'bg-hotpink/50 text-white/50 cursor-not-allowed'
                          }`}
                        >
                          Submit Denial
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isCompleted && (
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
