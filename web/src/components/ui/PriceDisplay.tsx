'use client';

import React from 'react';
import { useOracle } from '@/context/OracleContext';
import { Loader2 } from 'lucide-react';

interface PriceDisplayProps {
  amountUsd: number;
  className?: string;
  usdClassName?: string;
  xlmClassName?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  amountUsd, 
  className = '',
  usdClassName = 'font-bold text-white',
  xlmClassName = 'text-xs text-gray-400 font-normal ml-1'
}) => {
  const { calculateXlm, isLoading } = useOracle();
  const xlmAmount = calculateXlm(amountUsd);

  return (
    <span className={`inline-flex items-center whitespace-nowrap ${className}`}>
      <span className={usdClassName}>${amountUsd.toFixed(2)}</span>
      {isLoading ? (
        <Loader2 className="w-3 h-3 text-gray-400 animate-spin ml-1" />
      ) : (
        <span className={xlmClassName}>(~{xlmAmount.toFixed(2)} XLM)</span>
      )}
    </span>
  );
};
