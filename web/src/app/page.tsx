'use client';

import React, { useState } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { ValueProps } from '@/components/ValueProps';
import { RoleModal } from '@/components/RoleModal';

export default function Home() {
  const [searchVal, setSearchVal] = useState<string>('');

  return (
    <div className="min-h-screen bg-obsidian text-white scanlines">
      {/* Onboarding role selection modal */}
      <RoleModal />

      {/* Hero Header block */}
      <HeroSection 
        searchVal={searchVal} 
        onSearchChange={setSearchVal} 
      />

      {/* Platform features grid */}
      <ValueProps />
    </div>
  );
}
