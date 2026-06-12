import React, { useState } from 'react';
import { Gig, MilestoneConfig } from '@/lib/mockGigs';
import { X, Save, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { PriceDisplay } from '@/components/ui/PriceDisplay';

interface ListingModalProps {
  gig?: Gig | null; // Pass gig to edit, or null to create new
  onClose: () => void;
  onSave: (gig: Partial<Gig>) => void;
}

export const ListingModal: React.FC<ListingModalProps> = ({ gig, onClose, onSave }) => {
  const isEditing = !!gig;
  const isOccupied = gig?.status === 'occupied';

  // Initialize state directly from props to avoid useEffect cascading renders
  const [formData, setFormData] = useState({
    title: gig?.title || '',
    category: gig?.category || 'design' as Gig['category'],
    description: gig?.description || '',
    priceUSD: gig?.priceUSD || 100,
    upfrontPercentage: gig?.upfrontPercentage || 20,
    tags: gig?.tags?.join(', ') || '',
    status: gig?.status || 'active' as Gig['status'],
    milestones: gig?.milestones || [] as MilestoneConfig[]
  });

  const upfrontAmount = formData.priceUSD * (formData.upfrontPercentage / 100);
  const milestoneTotal = formData.milestones.reduce((acc, m) => acc + m.payoutUSD, 0);
  const totalAllocated = upfrontAmount + milestoneTotal;
  const isMilestonesValid = formData.milestones.length === 0 || Math.abs(totalAllocated - formData.priceUSD) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-violet-dark border border-white/10 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4 sticky top-0 bg-violet-dark z-10">
          <h2 className="text-xl font-heading font-bold text-white">
            {isEditing ? 'Edit Service Listing' : 'Create New Service'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isOccupied && (
          <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mb-6">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-[10px] uppercase font-bold tracking-wider text-yellow-500 leading-relaxed">
              This service is currently occupied by an active escrow contract. You cannot change the Price, Upfront %, or Description until the contract is completed.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Service Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="I will design a custom logo..."
                required
                className="w-full bg-obsidian border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neoncyan transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as Gig['category']})}
                className="w-full bg-obsidian border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neoncyan transition-colors appearance-none"
              >
                <option value="design">Design & Art</option>
                <option value="dev">Development</option>
                <option value="music">Music & Audio</option>
                <option value="copywriting">Copywriting</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Search Tags (Comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => setFormData({...formData, tags: e.target.value})}
                placeholder="e.g. logo, branding, vector"
                className="w-full bg-obsidian border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neoncyan transition-colors"
              />
            </div>

            <div className="space-y-1 md:col-span-2 border-t border-white/5 pt-5 mt-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-between">
                <span>Description & Scope of Work</span>
                {isOccupied && <span className="text-yellow-500">Locked</span>}
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                disabled={isOccupied}
                required
                placeholder="Explain exactly what the client will receive..."
                className={`w-full border rounded-lg p-3 text-sm text-white resize-none h-32 transition-colors ${
                  isOccupied ? 'bg-white/5 border-white/5 opacity-60 cursor-not-allowed' : 'bg-obsidian border-white/10 focus:outline-none focus:border-neoncyan'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-between">
                <span className="flex items-center gap-2">Price (USD) <PriceDisplay amountUsd={formData.priceUSD || 0} usdClassName="hidden" xlmClassName="text-[10px] text-neoncyan font-bold" /></span>
                {isOccupied && <span className="text-yellow-500">Locked</span>}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={formData.priceUSD}
                  onChange={e => setFormData({...formData, priceUSD: Number(e.target.value)})}
                  disabled={isOccupied}
                  required
                  min="1"
                  className={`w-full pl-8 pr-3 py-3 rounded-lg text-sm transition-colors ${
                    isOccupied ? 'bg-white/5 border border-white/5 text-gray-400 cursor-not-allowed' : 'bg-obsidian border border-white/10 text-white focus:outline-none focus:border-neoncyan'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-between">
                <span>Required Upfront Payment (%)</span>
                {isOccupied && <span className="text-yellow-500">Locked</span>}
              </label>
              <div className="flex items-center gap-4 bg-obsidian border border-white/10 rounded-lg p-3">
                <input
                  type="range"
                  min="0" max="50" step="5"
                  value={formData.upfrontPercentage}
                  onChange={e => setFormData({...formData, upfrontPercentage: Number(e.target.value)})}
                  disabled={isOccupied}
                  className={`flex-1 ${isOccupied ? 'opacity-50 cursor-not-allowed' : 'accent-hotpink cursor-pointer'}`}
                />
                <span className={`text-sm font-bold font-mono ${isOccupied ? 'text-gray-400' : 'text-neongreen'}`}>
                  {formData.upfrontPercentage}%
                </span>
              </div>
            </div>

            <div className="space-y-1 md:col-span-2 border-t border-white/5 pt-5 mt-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-between">
                <span>Milestone Payment Schedule (Optional)</span>
                {isOccupied && <span className="text-yellow-500">Locked</span>}
              </label>
              <p className="text-xs text-gray-400 mb-3">
                If left empty, the remaining balance will automatically become a single final milestone.
              </p>
              
              <div className="space-y-3">
                {formData.milestones.map((milestone, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-3 items-start bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="flex-1 space-y-1 w-full">
                      <label className="text-[10px] uppercase text-gray-400">Milestone Title</label>
                      <input 
                        type="text"
                        value={milestone.title}
                        onChange={(e) => {
                          const newM = [...formData.milestones];
                          newM[idx].title = e.target.value;
                          setFormData({...formData, milestones: newM});
                        }}
                        disabled={isOccupied}
                        required
                        className={`w-full p-2 text-sm rounded transition-colors ${isOccupied ? 'bg-white/5 border border-white/5 text-gray-400 cursor-not-allowed' : 'bg-obsidian border border-white/10 text-white focus:outline-none focus:border-neoncyan'}`}
                      />
                    </div>
                    <div className="w-full md:w-32 space-y-1">
                      <label className="text-[10px] uppercase text-gray-400 flex items-center gap-1">Payout ($) <PriceDisplay amountUsd={milestone.payoutUSD || 0} usdClassName="hidden" xlmClassName="text-[10px] text-neoncyan font-bold" /></label>
                      <input 
                        type="number"
                        value={milestone.payoutUSD || ''}
                        onChange={(e) => {
                          const newM = [...formData.milestones];
                          newM[idx].payoutUSD = Number(e.target.value);
                          setFormData({...formData, milestones: newM});
                        }}
                        disabled={isOccupied}
                        required
                        min="1"
                        className={`w-full p-2 text-sm rounded transition-colors ${isOccupied ? 'bg-white/5 border border-white/5 text-gray-400 cursor-not-allowed' : 'bg-obsidian border border-white/10 text-white focus:outline-none focus:border-neoncyan'}`}
                      />
                    </div>
                    <div className="w-full md:w-24 space-y-1">
                      <label className="text-[10px] uppercase text-gray-400">Revisions</label>
                      <input 
                        type="number"
                        value={milestone.maxRevisions || ''}
                        onChange={(e) => {
                          const newM = [...formData.milestones];
                          newM[idx].maxRevisions = Number(e.target.value);
                          setFormData({...formData, milestones: newM});
                        }}
                        disabled={isOccupied}
                        required
                        min="0"
                        className={`w-full p-2 text-sm rounded transition-colors ${isOccupied ? 'bg-white/5 border border-white/5 text-gray-400 cursor-not-allowed' : 'bg-obsidian border border-white/10 text-white focus:outline-none focus:border-neoncyan'}`}
                      />
                    </div>
                    {!isOccupied && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const newM = [...formData.milestones];
                          newM.splice(idx, 1);
                          setFormData({...formData, milestones: newM});
                        }}
                        className="mt-6 p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {!isOccupied && (
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData, 
                    milestones: [...formData.milestones, { title: '', payoutUSD: 0, maxRevisions: 0 }]
                  })}
                  className="mt-3 flex items-center gap-2 text-xs font-bold text-neoncyan hover:text-white transition-colors py-2 px-3 bg-neoncyan/10 hover:bg-neoncyan/20 rounded-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Milestone
                </button>
              )}

              {formData.milestones.length > 0 && (
                <div className={`mt-4 p-3 rounded-lg border text-sm font-bold flex flex-col md:flex-row md:items-center justify-between gap-2 ${isMilestonesValid ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  <span>Upfront: <PriceDisplay amountUsd={upfrontAmount} usdClassName="font-bold" xlmClassName="text-[10px] opacity-70 ml-1" /> + Milestones: <PriceDisplay amountUsd={milestoneTotal} usdClassName="font-bold" xlmClassName="text-[10px] opacity-70 ml-1" /></span>
                  <span>Sum: ${totalAllocated.toFixed(2)} / ${formData.priceUSD.toFixed(2)} {isMilestonesValid ? '(Correct!)' : '(Mismatch)'}</span>
                </div>
              )}
            </div>
          </div>

          {isEditing && !isOccupied && (
             <div className="space-y-2 border-t border-white/5 pt-5 mt-2">
               <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Listing Status</label>
               <div className="flex gap-4">
                 <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                   <input
                     type="radio"
                     checked={formData.status === 'active'}
                     onChange={() => setFormData({...formData, status: 'active' as Gig['status']})}
                     className="accent-neoncyan"
                   />
                   Active (Visible in Marketplace)
                 </label>
                 <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white">
                   <input
                     type="radio"
                     checked={formData.status === 'paused'}
                     onChange={() => setFormData({...formData, status: 'paused' as Gig['status']})}
                     className="accent-neoncyan"
                   />
                   Paused (Hidden from Marketplace)
                 </label>
               </div>
             </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-white/5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg bg-white/5 text-white font-heading font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMilestonesValid}
              className={`flex-1 py-3 rounded-lg font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isMilestonesValid 
                  ? 'bg-neoncyan text-obsidian hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] cursor-pointer' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Save Changes' : 'Create Listing'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
