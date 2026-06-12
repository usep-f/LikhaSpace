import React from 'react';
import { Order } from '@/lib/mockGigs';
import { X, CheckCircle, Circle, ArrowRightCircle } from 'lucide-react';

interface StatusModalProps {
  order: Order;
  onClose: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({ order, onClose }) => {
  const isDisputed = order.status === 'disputed' || order.status === 'mediation';
  const isDenied = order.status === 'denied';
  
  const milestones = order.milestones || [];
  const currentIdx = order.currentMilestoneIdx || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-violet-dark border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-white">Project Status</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
          {/* Fluid Percentage Progress Bar */}
          <div className="mb-8 relative">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Completion Progress</span>
              <span className="font-mono text-sm font-bold text-neoncyan">{order.progressPercentage}%</span>
            </div>

            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-neoncyan rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,255,255,0.6)]"
                style={{ width: `${Math.min(Math.max(order.progressPercentage, 0), 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Edge Cases */}
          {isDisputed && (
             <div className="p-4 rounded-lg bg-hotpink/10 border border-hotpink/30 text-hotpink text-sm text-center font-bold mb-6">
               Project is currently in Dispute Arbitration.
             </div>
          )}
          {isDenied && (
             <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center font-bold mb-6">
               Project request was denied.
             </div>
          )}

          {/* Milestone Timeline */}
          {milestones.length > 0 && (
            <div className="mb-8 bg-obsidian border border-white/5 rounded-xl p-4">
              <h3 className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-4 pb-2 border-b border-white/5">Milestone Timeline</h3>
              <div className="space-y-4">
                {milestones.map((milestone, idx) => {
                  let Icon = Circle;
                  let iconColor = 'text-gray-500';
                  let textColor = 'text-gray-500';
                  let statusText = 'Locked';

                  if (milestone.state === 'approved') {
                    Icon = CheckCircle;
                    iconColor = 'text-neongreen';
                    textColor = 'text-white';
                    statusText = 'Approved';
                  } else if (milestone.state === 'active') {
                    Icon = ArrowRightCircle;
                    iconColor = 'text-neoncyan text-glow-cyan';
                    textColor = 'text-white';
                    statusText = 'Active';
                  } else if (milestone.state === 'submitted') {
                    Icon = ArrowRightCircle;
                    iconColor = 'text-yellow-400';
                    textColor = 'text-white';
                    statusText = 'Under Review';
                  }

                  return (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="flex flex-col items-center mt-1">
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                        {idx !== milestones.length - 1 && (
                          <div className={`w-px h-full my-1 min-h-[24px] ${idx < currentIdx ? 'bg-neongreen' : 'bg-white/10'}`}></div>
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm font-bold ${textColor}`}>{milestone.title}</p>
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 ${iconColor}`}>{statusText}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Payout: ${milestone.payoutUSD} USD</p>
                        {milestone.state !== 'locked' && (
                          <p className="text-[10px] text-gray-500 mt-1">Revisions used: {milestone.revisionsUsed || 0} / {milestone.maxRevisions}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Freelancer Changelog */}
          <div className="bg-obsidian border border-white/5 rounded-xl p-4">
            <h3 className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-4 pb-2 border-b border-white/5">Freelancer Changelog</h3>

            <div className="space-y-4">
              {order.changelogs && order.changelogs.length > 0 ? (
                order.changelogs.slice().reverse().map((entry, idx) => (
                  <div key={entry.id} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-hotpink shadow-[0_0_5px_rgba(255,0,127,0.5)]"></div>
                      {idx !== order.changelogs.length - 1 && (
                        <div className="w-px h-full bg-white/10 my-1 min-h-[20px]"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-300 leading-relaxed bg-white/5 p-2 rounded-lg border border-white/5">
                        {entry.message}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1.5 ml-1">
                        {new Date(entry.timestamp).toLocaleString(undefined, {
                           month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">The freelancer hasn&apos;t posted any updates yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
