'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GigsFeed } from '@/components/GigsFeed';
import { ProfileModal } from '@/components/ProfileModal';
import { BookingModal } from '@/components/BookingModal';
import { LoginModal } from '@/components/LoginModal';
import { Gig, FreelancerProfile, Order } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';
import { useWallet } from '@/context/WalletContext';
import { createOrder, getUserProfile, createNotification } from '@/lib/db';

function GigsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // Create a controlled state for the search bar
  const [currentSearch, setCurrentSearch] = useState(initialSearch);
  const [prevSearchParam, setPrevSearchParam] = useState(initialSearch);

  // Derive state during render instead of using useEffect
  if (initialSearch !== prevSearchParam) {
    setPrevSearchParam(initialSearch);
    setCurrentSearch(initialSearch);
  }

  const [selectedProfile, setSelectedProfile] = useState<FreelancerProfile | null>(null);
  const [selectedGigToBook, setSelectedGigToBook] = useState<Gig | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  const { showToast } = useNotification();
  const { address, userProfile } = useWallet();

  const handleProfileClick = async (profileAddress: string) => {
    try {
      const p = await getUserProfile(profileAddress);
      if (p) {
        setSelectedProfile({
          address: profileAddress,
          name: p.name || 'Anonymous',
          title: p.title || '',
          bio: p.bio || '',
          totalEarnedXLM: p.totalEarnedXLM || 0,
          projectsCompleted: p.projectsCompleted || 0,
          averageRating: p.averageRating || 5.0,
          testimonials: p.testimonials || [],
        });
      } else {
        showToast('Freelancer profile not found in database.', 'error');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      showToast('Failed to load freelancer profile.', 'error');
    }
  };

  const handleBookGig = async (gig: Gig, message: string) => {
    if (!address) {
      showToast('Please connect your wallet to book a service.', 'error');
      return;
    }
    showToast('Submitting booking request...', 'info');
    try {
      const orderId = crypto.randomUUID();
      const order: Order = {
        id: orderId,
        gigId: gig.id,
        clientAddress: address,
        clientName: userProfile?.name || 'Client (' + address.slice(0, 4) + '...' + address.slice(-4) + ')',
        freelancerAddress: gig.freelancerAddress,
        status: 'pending_acceptance',
        priceUSD: gig.priceUSD,
        proposalText: message,
        progressPercentage: 0,
        changelogs: [{
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          message: 'Booking request sent to freelancer.'
        }],
        chatMessages: [],
        milestones: gig.milestones || [],
      };
      await createOrder(order);
      await createNotification({
        recipientId: gig.freelancerAddress,
        senderId: address,
        senderName: userProfile?.name || 'Client',
        title: 'New Booking Request',
        message: `You have received a new booking request for "${gig.title}".`,
        type: 'booking',
        orderId: orderId,
      });
      showToast(`Booking request sent for "${gig.title}". This will trigger the Escrow initialization upon Freelancer acceptance.`, 'success');
      setSelectedGigToBook(null);
    } catch (err: unknown) {
      console.error('Booking failed:', err);
      showToast(err instanceof Error ? err.message : 'Booking request failed', 'error');
    }
  };

  return (
    <>
      <GigsFeed
        searchVal={currentSearch}
        onSearchChange={setCurrentSearch}
        onProfileClick={handleProfileClick}
        onBookClick={(gig) => {
          if (!address) {
            setShowLoginModal(true);
          } else {
            setSelectedGigToBook(gig);
          }
        }}
      />

      {/* Modals */}
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}

      {selectedGigToBook && (
        <BookingModal
          gig={selectedGigToBook}
          onClose={() => setSelectedGigToBook(null)}
          onConfirm={handleBookGig}
        />
      )}

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} message="Please connect your Stellar wallet to book a gig." />
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
