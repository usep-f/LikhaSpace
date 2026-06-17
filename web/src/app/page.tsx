'use client';

import React, { useState } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { SaaSPlatformMetrics } from '@/components/SaaSPlatformMetrics';
import { SaaSHowItWorks } from '@/components/SaaSHowItWorks';
import { SaaSUseCases } from '@/components/SaaSUseCases';
import { SaaSStellarSpotlight } from '@/components/SaaSStellarSpotlight';
import { SaaSXlmExplainer } from '@/components/SaaSXlmExplainer';
import { SaaSFaqAccordion } from '@/components/SaaSFaqAccordion';
import { SaaSCtaBanner } from '@/components/SaaSCtaBanner';

export default function Home() {
  const [searchVal, setSearchVal] = useState<string>('');

  return (
    <div className="min-h-screen bg-obsidian text-white scanlines">
      {/* Hero Section */}
      <HeroSection 
        searchVal={searchVal} 
        onSearchChange={setSearchVal} 
      />

      {/* Key SaaS Metrics Grid */}
      <SaaSPlatformMetrics />

      {/* How it Works / Escrow Pipeline */}
      <SaaSHowItWorks />

      {/* Target Audience Use Cases */}
      <SaaSUseCases />

      {/* Dedicated Stellar Spotlight Section */}
      <SaaSStellarSpotlight />

      {/* Dedicated XLM Explainer & Price Card */}
      <SaaSXlmExplainer />

      {/* Interactive FAQ Accordion */}
      <SaaSFaqAccordion />

      {/* Bottom Conversion CTA Banner */}
      <SaaSCtaBanner />
    </div>
  );
}
