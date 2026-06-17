'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useNotification } from '@/context/NotificationContext';
import { PlusCircle } from 'lucide-react';
import { Gig } from '@/lib/types';
import { Pagination } from '@/components/Pagination';
import { DashboardSearch } from '@/components/DashboardSearch';
import { createGig, getFreelancerGigs, getUserProfile, deleteGig } from '@/lib/db';
import { ListingModal } from '@/components/ListingModal';

export const ListingsView: React.FC = () => {
  const { address } = useWallet();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const { showToast, showConfirm, showLoading, hideLoading } = useNotification();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);

  const loadGigs = useCallback(async () => {
    if (!address) return;
    try {
      const res = await getFreelancerGigs(address);
      setGigs(res);
    } catch (err) {
      console.error('Failed to load gigs:', err);
    }
  }, [address]);

  useEffect(() => {
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

  const handleDelete = (gig: Gig) => {
    showConfirm(
      'Delete Service Listing',
      `Are you sure you want to delete "${gig.title}"? This action cannot be undone.`,
      async () => {
        try {
          showLoading('Deleting service listing...');
          await deleteGig(gig.id);
          await loadGigs();
          showToast('Listing deleted successfully!', 'success');
        } catch (e: unknown) {
          showToast(`Failed to delete: ${e instanceof Error ? e.message : String(e)}`, 'error');
        } finally {
          hideLoading();
        }
      }
    );
  };

  const buildGigPayload = (updatedGig: Partial<Gig>, freelancerName: string): Gig => ({
    id: editingGig?.id || crypto.randomUUID(),
    freelancerAddress: address!,
    freelancerName,
    title: updatedGig.title || '',
    category: updatedGig.category || 'design',
    description: updatedGig.description || '',
    priceUSD: updatedGig.priceUSD || 100,
    tags: updatedGig.tags || [],
    status: updatedGig.status || 'active',
    milestones: updatedGig.milestones || [],
  });

  const handleSaveListing = async (updatedGig: Partial<Gig>) => {
    if (!address) return showToast('Wallet not connected', 'error');
    try {
      showLoading('Saving service listing...');
      const profile = await getUserProfile(address);
      const gig = buildGigPayload(updatedGig, profile?.name || 'Freelancer');
      await createGig(gig);
      await loadGigs();
      showToast('Listing saved successfully!', 'success');
      setIsListingModalOpen(false);
    } catch (e: unknown) {
      showToast(`Failed to save listing: ${e instanceof Error ? e.message : String(e)}`, 'error');
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
               <div className="flex gap-3">
                 <button
                   onClick={() => handleEdit(gig)}
                   className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                 >
                   Edit
                 </button>
                 <button
                   onClick={() => handleDelete(gig)}
                   className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer shrink-0"
                 >
                   Delete
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
