'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Coins, RefreshCw, AlertCircle } from 'lucide-react';
import { getOraclePrice } from '@/lib/contract';

export interface PriceData {
  usdPerXlm: number;
  xlmPerUsd: number;
  timestamp: Date;
}

export interface LivePriceCardProps {
  className?: string;
}

export const LivePriceCard: React.FC<LivePriceCardProps> = ({ className = '' }) => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const stroopsPerCent = await getOraclePrice();
      if (stroopsPerCent <= 0) {
        throw new Error('Invalid rate received');
      }
      setPriceData({
        usdPerXlm: 100000 / stroopsPerCent,
        xlmPerUsd: stroopsPerCent / 100000,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('Error fetching live price feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve price');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    
    const runFetch = async () => {
      try {
        await fetchPrice();
      } catch (err) {
        console.error(err);
      }
    };

    const timer = setTimeout(() => {
      if (active) {
        void runFetch();
      }
    }, 0);

    const interval = setInterval(() => {
      if (active) {
        void fetchPrice(true);
      }
    }, 30000);

    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchPrice]);

  if (isLoading) {
    return (
      <div className={`glass-card border border-white/10 rounded-xl p-4 w-full max-w-md animate-pulse flex flex-col space-y-3 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="h-3 w-20 bg-white/20 rounded" />
          <div className="h-2 w-2 rounded-full bg-white/20" />
        </div>
        <div className="h-6 w-32 bg-white/20 rounded" />
        <div className="h-3 w-24 bg-white/20 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass-card border border-red-500/20 rounded-xl p-4 w-full max-w-md flex flex-col space-y-2 ${className}`}>
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Oracle Connection Failure</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-tight">Couldn&apos;t load live feed</p>
        <button
          onClick={() => void fetchPrice()}
          className="mt-1 w-full py-1 text-center bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-[10px] font-bold uppercase rounded cursor-pointer transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className={`glass-card border border-white/10 rounded-xl p-4 w-full max-w-md flex flex-col justify-between shadow-[0_0_15px_rgba(0,243,255,0.05)] transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-neoncyan">
          <Coins className="w-3.5 h-3.5" />
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-glow-cyan">XLM Price Feed</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neongreen opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neongreen" />
          </span>
          <span className="text-[9px] font-mono text-neongreen tracking-wider uppercase">Live</span>
        </div>
      </div>

      <div className="mt-2 text-left">
        <div className="flex items-baseline space-x-1">
          <span className="text-xl font-heading font-bold text-white tracking-tight">
            ${priceData?.usdPerXlm.toFixed(4)}
          </span>
          <span className="text-[9px] text-gray-400 uppercase font-semibold">USD</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          1 USD ≈ {priceData?.xlmPerUsd.toFixed(2)} XLM
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5 text-[9px] text-gray-500 font-mono">
        <span>
          Reflector Feed
        </span>
        <button
          onClick={() => void fetchPrice()}
          disabled={isRefreshing}
          className="flex items-center space-x-1 text-gray-400 hover:text-white disabled:opacity-50 cursor-pointer transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-neoncyan focus-visible:outline-none"
          title="Refresh Price"
          aria-label="Refresh price feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-neoncyan' : ''}`} />
        </button>
      </div>
    </div>
  );
};
