import React, { useState } from 'react';
import { Gig } from '@/lib/mockGigs';
import { X, Save, AlertTriangle } from 'lucide-react';

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
    status: gig?.status || 'active' as Gig['status']
  });

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
                <span>Price (USD)</span>
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
              className="flex-1 py-3 rounded-lg bg-neoncyan text-obsidian font-heading font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
