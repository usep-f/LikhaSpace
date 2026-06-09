'use client';

import React, { useState, useEffect } from 'react';
import { mockGigs, Gig } from '@/lib/mockGigs';
import { Tag, HelpCircle, ArrowUpRight, Star } from 'lucide-react';

// Sub-component: Status Badge
const StatusBadge: React.FC<{ status: Gig['status'] }> = ({ status }) => {
  const styles = {
    active: 'bg-neongreen/10 text-neongreen border-neongreen/20 text-glow-green',
    occupied: 'bg-white/10 text-white border-white/20',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${styles[status]}`}>
      {status === 'active' ? 'Available' : 'Occupied'}
    </span>
  );
};

// Sub-component: Gig Card
interface CardProps {
  gig: Gig;
  xlmRate: number;
  onBookClick: (gig: Gig) => void;
  onProfileClick: (address: string) => void;
}

const GigCard: React.FC<CardProps> = ({ gig, xlmRate, onBookClick, onProfileClick }) => {
  const xlmBudget = Math.round(gig.priceUSD * xlmRate);
  
  return (
    <div className={`p-6 rounded-xl glass-card border flex flex-col justify-between space-y-4 transition-all ${
      gig.status === 'occupied'
        ? 'opacity-60 border-white/5 grayscale-[50%]'
        : 'border-white/5 hover:border-hotpink/30 hover:shadow-[0_0_14px_rgba(255,0,127,0.15)]'
    }`}>
      <div>
        <div className="flex items-start justify-between">
          <StatusBadge status={gig.status} />

          <button
            onClick={() => onProfileClick(gig.freelancerAddress)}
            className="flex items-center space-x-1 hover:text-hotpink transition-colors group cursor-pointer"
          >
            <span className="text-[10px] text-gray-400 font-mono font-bold tracking-wider group-hover:text-hotpink">
              {gig.freelancerName}
            </span>
            <ArrowUpRight className="w-3 h-3 text-gray-500 group-hover:text-hotpink" />
          </button>
        </div>
        
        <h3 className="font-heading font-bold text-base text-white mt-3 leading-tight">
          {gig.title}
        </h3>

        {gig.rating && (
           <div className="flex items-center space-x-1 mt-2 text-xs text-yellow-400 font-bold">
             <Star className="w-3.5 h-3.5 fill-current" />
             <span>{gig.rating}</span>
             <span className="text-gray-500 font-normal">({gig.reviewsCount})</span>
           </div>
        )}
        
        <p className="text-xs text-gray-400 mt-3 line-clamp-3 leading-relaxed">{gig.description}</p>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/5">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {gig.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center text-[10px] text-neoncyan bg-neoncyan/5 px-2 py-0.5 rounded border border-neoncyan/10 font-sans">
              <Tag className="w-2.5 h-2.5 mr-1" />
              {tag}
            </span>
          ))}
        </div>

        {/* Budget Details & Action */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-bold text-white font-heading mt-0.5 flex items-center gap-2">
              ${gig.priceUSD}
              <span className="text-[10px] uppercase tracking-wider text-gray-500">
                ({gig.upfrontPercentage}% Upfront)
              </span>
            </p>
          </div>
          <button
            disabled={gig.status === 'occupied'}
            onClick={() => onBookClick(gig)}
            className={`px-4 py-1.5 rounded text-xs font-bold font-heading uppercase tracking-wider transition-all ${
              gig.status === 'occupied'
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-hotpink text-white hover:shadow-[0_0_10px_rgba(255,0,127,0.4)] cursor-pointer'
            }`}
          >
            {gig.status === 'occupied' ? 'Unavailable' : 'Book Service'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component: Category Tabs
interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const CategoryTabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'all', label: 'All Services' },
    { id: 'music', label: 'Audio & Music' },
    { id: 'design', label: 'Design & Art' },
    { id: 'dev', label: 'Development' },
    { id: 'copywriting', label: 'Copywriting' },
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center border-b border-white/5 pb-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-lg font-heading text-xs font-semibold tracking-wide cursor-pointer transition-all duration-200 border ${
              isActive 
                ? 'bg-hotpink/10 border-hotpink text-hotpink text-glow-pink shadow-[0_0_8px_rgba(255,0,127,0.25)]' 
                : 'bg-white/5 border-transparent text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

interface GigsFeedProps {
  searchVal: string;
  onProfileClick: (address: string) => void;
  onBookClick: (gig: Gig) => void;
}

export const GigsFeed: React.FC<GigsFeedProps> = ({ searchVal, onProfileClick, onBookClick }) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [xlmRate, setXlmRate] = useState<number>(9.09);

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd')
      .then((res) => res.json())
      .then((data) => {
        if (data?.stellar?.usd) {
          setXlmRate(1 / data.stellar.usd);
        }
      })
      .catch((err) => console.log('CoinGecko fetch failed, using fallback rate:', err));
  }, []);

  const filteredGigs = mockGigs.filter((gig) => {
    const matchesCategory = activeTab === 'all' || gig.category === activeTab;
    const searchLower = searchVal.toLowerCase();
    const matchesSearch = 
      gig.title.toLowerCase().includes(searchLower) ||
      gig.description.toLowerCase().includes(searchLower) ||
      gig.freelancerName.toLowerCase().includes(searchLower) ||
      gig.tags.some(t => t.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="feed" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="text-center mb-8">
        <h2 className="font-heading text-3xl font-bold text-white tracking-tight">
          Freelance <span className="text-hotpink text-glow-pink">Services</span>
        </h2>
        <p className="text-sm text-gray-400 mt-2">
          Browse top-tier Filipino creatives and book their services instantly with secure escrow.
        </p>
      </div>

      <CategoryTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {filteredGigs.length > 0 ? (
          filteredGigs.map((gig) => (
            <GigCard
              key={gig.id}
              gig={gig}
              xlmRate={xlmRate}
              onBookClick={onBookClick}
              onProfileClick={onProfileClick}
            />
          ))
        ) : (
          <div className="col-span-full py-16 text-center glass-card border border-white/5 rounded-xl">
            <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-white font-heading font-bold text-base">No Services Found</h3>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search criteria or category filter.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
