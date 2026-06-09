'use client';

import React, { useState, useEffect } from 'react';
import { mockGigs, Gig } from '@/lib/mockGigs';
import { Tag, HelpCircle, ArrowUpRight } from 'lucide-react';

// Sub-component: Status Badge
const StatusBadge: React.FC<{ status: Gig['status'] }> = ({ status }) => {
  const styles = {
    open: 'bg-neongreen/10 text-neongreen border-neongreen/20 text-glow-green',
    active: 'bg-neoncyan/10 text-neoncyan border-neoncyan/20 text-glow-cyan',
    completed: 'bg-white/10 text-white border-white/20',
    disputed: 'bg-hotpink/10 text-hotpink border-hotpink/20 text-glow-pink',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
};

// Sub-component: Gig Card
interface CardProps {
  gig: Gig;
  xlmRate: number;
}

const GigCard: React.FC<CardProps> = ({ gig, xlmRate }) => {
  const xlmBudget = Math.round(gig.budgetUSD * xlmRate);
  
  return (
    <div className="p-6 rounded-xl glass-card border border-white/5 hover:border-hotpink/30 hover:shadow-[0_0_14px_rgba(255,0,127,0.15)] flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-start justify-between">
          <StatusBadge status={gig.status} />
          <span className="text-[10px] text-gray-500 font-mono font-bold tracking-wider">{gig.clientAddress}</span>
        </div>
        
        <h3 className="font-heading font-bold text-base text-white mt-3 hover:text-hotpink transition-colors duration-150 cursor-pointer flex items-center justify-between">
          <span>{gig.title}</span>
          <ArrowUpRight className="w-4 h-4 text-gray-500" />
        </h3>
        
        <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">{gig.description}</p>
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

        {/* Budget Details */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Budget</p>
            <p className="text-sm font-bold text-white font-heading mt-0.5">
              ${gig.budgetUSD} USD <span className="text-xs text-gray-400 font-normal">≈ {xlmBudget.toLocaleString()} XLM</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Upfront</p>
            <p className="text-xs font-bold text-neongreen text-glow-green font-heading mt-0.5">
              {gig.upfrontPercentage}% payout
            </p>
          </div>
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
    { id: 'all', label: 'All Gigs' },
    { id: 'music', label: 'Music & Audio' },
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
}

export const GigsFeed: React.FC<GigsFeedProps> = ({ searchVal }) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [xlmRate, setXlmRate] = useState<number>(9.09); // Fallback: $1 USD ≈ 9.09 XLM (approx $0.11 per XLM)

  // Fetch XLM conversion rate on mount
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

  // Filter listings
  const filteredGigs = mockGigs.filter((gig) => {
    const matchesCategory = activeTab === 'all' || gig.category === activeTab;
    const searchLower = searchVal.toLowerCase();
    const matchesSearch = 
      gig.title.toLowerCase().includes(searchLower) ||
      gig.description.toLowerCase().includes(searchLower) ||
      gig.tags.some(t => t.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="feed" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="font-heading text-3xl font-bold text-white tracking-tight">
          Active Gigs <span className="text-neoncyan text-glow-cyan">Marketplace</span>
        </h2>
        <p className="text-sm text-gray-400 mt-2">
          Explore open projects funded under the secure Stellar escrow system.
        </p>
      </div>

      <CategoryTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {filteredGigs.length > 0 ? (
          filteredGigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} xlmRate={xlmRate} />
          ))
        ) : (
          <div className="col-span-full py-16 text-center glass-card border border-white/5 rounded-xl">
            <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-white font-heading font-bold text-base">No Gigs Found</h3>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search criteria or category filter.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
