'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GigsFeed } from '@/components/GigsFeed';

function GigsContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  return <GigsFeed searchVal={search} />;
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
