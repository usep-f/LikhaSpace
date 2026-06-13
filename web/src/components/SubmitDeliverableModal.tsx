import React, { useState } from 'react';
import { Order } from '@/lib/mockGigs';
import { X, UploadCloud, Link as LinkIcon, FileText } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { updateOrderStatus } from '@/lib/db';
import { submitDeliverable } from '@/lib/contract';
import { useNotification } from '@/context/NotificationContext';

interface SubmitDeliverableModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitDeliverableModal: React.FC<SubmitDeliverableModalProps> = ({ order, onClose, onSuccess }) => {
  const { showLoading, hideLoading } = useNotification();
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentIdx = order.currentMilestoneIdx || 0;
  const milestone = order.milestones?.[currentIdx];

  if (!milestone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
        <div className="bg-violet-dark p-6 rounded-2xl border border-white/10 max-w-md w-full text-center">
          <p className="text-white">No active milestone found.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-white">Close</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!file && !link && !notes) {
      setError('Please provide at least a file, a link, or some notes.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      showLoading('Submitting deliverables via Freighter...');
      let storagePath = '';
      let fileName = '';

      if (file) {
        // Use a structure: deliverables/{orderId}/{milestoneIdx}_{fileName}
        storagePath = `deliverables/${order.id}/${currentIdx}_${file.name}`;
        fileName = file.name;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
      }

      const updatedMilestones = order.milestones ? [...order.milestones] : [];
      updatedMilestones[currentIdx] = {
        ...updatedMilestones[currentIdx],
        state: 'submitted',
        deliverablesLink: link,
        deliverableNotes: notes,
        deliverablesStoragePath: storagePath,
        deliverablesFileName: fileName,
      };

      const newChangelog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message: `Submitted deliverables for milestone: ${milestone.title}`
      };

      if (order.txHash) {
        await submitDeliverable(order.txHash, order.freelancerAddress);
      }

      await updateOrderStatus(order.id, {
        status: 'delivered', // Updates the main order status to delivered
        milestones: updatedMilestones,
        hasSubmittedOnce: true,
        changelogs: [...(order.changelogs || []), newChangelog]
      });

      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setError(`Failed to submit: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
      hideLoading();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-violet-dark border border-white/10 rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-white">Submit Deliverables</h2>
            <p className="text-xs text-neoncyan mt-1">Milestone: {milestone.title}</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* File Upload */}
          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
              <UploadCloud className="w-3.5 h-3.5 text-neoncyan" /> Upload File (Optional)
            </label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-white/20 transition-colors bg-obsidian">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                {file ? (
                  <span className="text-sm text-neongreen font-bold truncate max-w-full px-4">{file.name}</span>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-gray-500" />
                    <span className="text-xs text-gray-400">Click to browse files</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* External Link */}
          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
              <LinkIcon className="w-3.5 h-3.5 text-neoncyan" /> External Link (Optional)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://figma.com/file/..."
              className="w-full bg-obsidian border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neoncyan transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
              <FileText className="w-3.5 h-3.5 text-neoncyan" /> Notes for Client
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain what you have done..."
              className="w-full bg-obsidian border border-white/10 rounded-lg p-3 text-sm text-white resize-none h-24 focus:outline-none focus:border-neoncyan transition-colors"
            />
          </div>

          {error && <p className="text-xs text-hotpink bg-hotpink/10 border border-hotpink/20 p-2 rounded">{error}</p>}

          <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg text-gray-400 font-bold text-xs hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-neoncyan text-obsidian font-heading font-bold text-xs uppercase hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Deliverables'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
