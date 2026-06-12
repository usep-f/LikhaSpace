'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getOraclePrice } from '@/lib/contract';

interface OracleContextType {
  stroopsPerCent: number;
  isLoading: boolean;
  calculateXlm: (priceUSD: number) => number;
}

const OracleContext = createContext<OracleContextType>({
  stroopsPerCent: 1000000, // Default fallback
  isLoading: true,
  calculateXlm: (priceUSD) => priceUSD * 10, // Default fallback calc
});

export const useOracle = () => useContext(OracleContext);

export const OracleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stroopsPerCent, setStroopsPerCent] = useState<number>(1000000);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchPrice = async () => {
      try {
        const price = await getOraclePrice();
        if (mounted && price) {
          setStroopsPerCent(price);
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Failed to fetch oracle price', e);
        if (mounted) setIsLoading(false);
      }
    };

    fetchPrice();
    // Refresh price every 5 minutes
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const calculateXlm = (priceUSD: number) => {
    return (priceUSD * stroopsPerCent) / 100000;
  };

  return (
    <OracleContext.Provider value={{ stroopsPerCent, isLoading, calculateXlm }}>
      {children}
    </OracleContext.Provider>
  );
};
