'use client';

import React, { useState } from 'react';
import { Gig } from '@/lib/types';
import { Tag, HelpCircle, ArrowUpRight, Star, Search } from 'lucide-react';
import { getAllGigs } from '@/lib/db';

// Sub-component: Status Badge
const StatusBadge: React.FC<{ status: Gig['status'] }> = ({ status }) => {
  const styles = {
    active: 'bg-neongreen/10 text-neongreen border-neongreen/20 text-glow-green',
    occupied: 'bg-white/10 text-white border-white/20',
    paused: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${styles[status]}`}>
      {status === 'active' ? 'Available' : status === 'occupied' ? 'Occupied' : 'Paused'}
    </span>
  );
};

// Sub-component: Gig Card
interface CardProps {
  gig: Gig;
  onBookClick: (gig: Gig) => void;
  onProfileClick: (address: string) => void;
}

const GigCard: React.FC<CardProps> = ({ gig,  onBookClick, onProfileClick }) => {
  return (
    <div className={`p-6 rounded-xl glass-card border flex flex-col justify-between space-y-4 transition-all ${
      gig.status === 'occupied'
        ? 'opacity-60 border-white/5 grayscale-50'
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

        {(gig.rating && gig.reviewsCount && gig.reviewsCount > 0) ? (
           <div className="flex items-center space-x-1 mt-2 text-xs text-yellow-400 font-bold">
             <Star className="w-3.5 h-3.5 fill-current" />
             <span>{gig.rating}</span>
             <span className="text-gray-500 font-normal">({gig.reviewsCount})</span>
           </div>
        ) : (
           <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500 font-bold">
             <Star className="w-3.5 h-3.5 opacity-30" />
             <span className="font-normal text-[10px] uppercase tracking-wider">No Reviews</span>
           </div>
        )}
        
        <p className="text-xs text-gray-400 mt-3 line-clamp-3 leading-relaxed">{gig.description}</p>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex flex-wrap gap-1.5">
          {gig.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center text-[10px] text-neoncyan bg-neoncyan/5 px-2 py-0.5 rounded border border-neoncyan/10 font-sans">
              <Tag className="w-2.5 h-2.5 mr-1" />
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-bold text-white font-heading mt-0.5">
              ${gig.priceUSD}
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
    <div className="flex flex-wrap gap-2 justify-center pb-2">
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

// Sub-component: Search Bar
interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => (
  <div className="relative w-full max-w-lg mx-auto mb-6">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search for services (e.g. Logo Design, Smart Contracts)..."
      className="w-full pl-12 pr-4 py-3 bg-obsidian border border-white/10 hover:border-white/20 focus:border-neoncyan focus:ring-1 focus:ring-neoncyan text-white text-sm rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
    />
  </div>
);

// Main Feed Component
interface GigsFeedProps {
  searchVal: string;
  onSearchChange: (val: string) => void;
  onProfileClick: (address: string) => void;
  onBookClick: (gig: Gig) => void;
}

export const GigsFeed: React.FC<GigsFeedProps> = ({ searchVal, onSearchChange, onProfileClick, onBookClick }) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  React.useEffect(() => {
    getAllGigs()
      .then((res) => {
        setGigs(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load gigs:', err);
        setLoading(false);
      });
  }, []);

  // Track filter changes by deriving state
  const [prevFilters, setPrevFilters] = useState({ searchVal, activeTab });
  if (prevFilters.searchVal !== searchVal || prevFilters.activeTab !== activeTab) {
    setPrevFilters({ searchVal, activeTab });
    setCurrentPage(1); // Reset page on new search/filter
  }

  const filteredGigs = gigs.filter((gig) => {
    if (gig.status === 'paused') return false;
    const matchesCategory = activeTab === 'all' || gig.category === activeTab;
    const searchLower = searchVal.toLowerCase();
    const matchesSearch = 
      gig.title.toLowerCase().includes(searchLower) ||
      gig.description.toLowerCase().includes(searchLower) ||
      gig.freelancerName.toLowerCase().includes(searchLower) ||
      gig.tags.some(t => t.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filteredGigs.length / itemsPerPage);
  const paginatedGigs = filteredGigs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="text-center py-20 font-heading text-xs uppercase tracking-widest text-gray-400">
        Loading services from database...
      </div>
    );
  }

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

      <SearchBar value={searchVal} onChange={onSearchChange} />

      <div className="border-b border-white/5 pb-6 mb-10">
        <CategoryTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedGigs.length > 0 ? (
          paginatedGigs.map((gig) => (
            <GigCard
              key={gig.id}
              gig={gig}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-12 pt-8 border-t border-white/5">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-heading text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Previous
          </button>

          <div className="text-xs text-gray-400 font-bold">
            Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-heading text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

    </section>
  );
};
