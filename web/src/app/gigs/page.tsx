'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GigsFeed } from '@/components/GigsFeed';
import { ProfileModal } from '@/components/ProfileModal';
import { BookingModal } from '@/components/BookingModal';
import { Gig, mockProfiles } from '@/lib/mockGigs';
import { useNotification } from '@/context/NotificationContext';

function GigsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // Create a controlled state for the search bar
  const [currentSearch, setCurrentSearch] = useState(initialSearch);
  const [prevSearchParam, setPrevSearchParam] = useState(initialSearch);

  // Derive state during render instead of using useEffect
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (initialSearch !== prevSearchParam) {
    setPrevSearchParam(initialSearch);
    setCurrentSearch(initialSearch);
  }

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedGigToBook, setSelectedGigToBook] = useState<Gig | null>(null);

  const { showToast } = useNotification();

  const handleBookGig = (gig: Gig, message: string) => {
    console.log(`Booking gig: ${gig.id} with message: ${message}`);
    showToast(`Booking request sent for "${gig.title}". This will trigger the Escrow initialization upon Freelancer acceptance.`, 'success');
    setSelectedGigToBook(null);
  };

  return (
    <>
      <GigsFeed
        searchVal={currentSearch}
        onSearchChange={setCurrentSearch}
        onProfileClick={(address) => setSelectedProfileId(address)}
        onBookClick={(gig) => setSelectedGigToBook(gig)}
      />

      {/* Modals */}
      {selectedProfileId && mockProfiles[selectedProfileId] && (
        <ProfileModal
          profile={mockProfiles[selectedProfileId]}
          onClose={() => setSelectedProfileId(null)}
        />
      )}

      {selectedGigToBook && (
        <BookingModal
          gig={selectedGigToBook}
          onClose={() => setSelectedGigToBook(null)}
          onConfirm={handleBookGig}
        />
      )}
    </>
  );
}

export default function GigsPage() {
  return (
    <div className="min-h-screen bg-obsidian text-white pt-6">
      <Suspense fallback={<div className="text-center py-20 font-heading text-xs uppercase tracking-widest text-gray-400">Loading marketplace...</div>}>
        <GigsContent />
      </Suspense>
    </div>
  );
}
