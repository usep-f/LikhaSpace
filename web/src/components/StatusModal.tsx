import React from 'react';
import { Order } from '@/lib/mockGigs';
import { X, CheckCircle, Clock } from 'lucide-react';

interface StatusModalProps {
  order: Order;
  onClose: () => void;
}

const STAGES = [
  { id: 'pending_acceptance', label: 'Requested' },
  { id: 'escrow_funded', label: 'Escrow Funded' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'completed', label: 'Completed' }
];

export const StatusModal: React.FC<StatusModalProps> = ({ order, onClose }) => {
  // Determine current stage index based on order status
  const currentStageIndex = STAGES.findIndex(s => s.id === order.status);
  const isDisputed = order.status === 'disputed';
  const isDenied = order.status === 'denied';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-violet-dark border border-white/10 rounded-2xl shadow-2xl p-6">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-bold text-white">Project Status</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Progress Bar */}
        <div className="mb-8 relative pt-4 pb-2">
          {/* Connecting Line */}
          <div className="absolute top-7 left-0 right-0 h-0.5 bg-white/10 z-0"></div>
          <div
            className="absolute top-7 left-0 h-0.5 bg-neoncyan z-0 transition-all duration-500"
            style={{ width: `${(Math.max(0, currentStageIndex) / (STAGES.length - 1)) * 100}%` }}
          ></div>

          <div className="relative z-10 flex justify-between">
            {STAGES.map((stage, idx) => {
              const isPast = currentStageIndex > idx;
              const isCurrent = currentStageIndex === idx;


              return (
                <div key={stage.id} className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-2 text-obsidian ${
                    isPast || isCurrent ? 'bg-neoncyan shadow-[0_0_10px_rgba(0,255,255,0.4)]' : 'bg-gray-600'
                  }`}>
                    {isPast || isCurrent ? <CheckCircle className="w-4 h-4 text-obsidian" /> : <Clock className="w-3 h-3 text-gray-400" />}
                  </div>
                  <span className={`text-[9px] uppercase font-bold tracking-wider ${
                    isPast || isCurrent ? 'text-neoncyan' : 'text-gray-500'
                  }`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
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

        {/* History Timeline */}
        <div className="bg-obsidian border border-white/5 rounded-xl p-4">
          <h3 className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-4">Event History</h3>

          <div className="space-y-4">
            {order.statusHistory && order.statusHistory.length > 0 ? (
              order.statusHistory.map((event, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-neoncyan shadow-[0_0_5px_rgba(0,255,255,0.5)]"></div>
                    {idx !== order.statusHistory.length - 1 && (
                      <div className="w-px h-full bg-white/10 my-1"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase">{event.status.replace('_', ' ')}</p>
                    {event.description && <p className="text-xs text-gray-400 mt-0.5">{event.description}</p>}
                    <p className="text-[9px] text-gray-500 mt-1">
                      {new Date(event.timestamp).toLocaleString(undefined, {
                         month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No history available yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
