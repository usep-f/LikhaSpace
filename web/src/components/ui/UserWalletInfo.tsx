'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { getUserProfile } from '@/lib/db';

export interface UserWalletInfoProps {
  address: string;
  role: 'client' | 'freelancer';
  fallbackName?: string;
  className?: string;
  showLabel?: boolean;
}

// Session-level cache to avoid redundant profile fetches
const profileCache: Record<string, string> = {};

export const UserWalletInfo: React.FC<UserWalletInfoProps> = ({
  address,
  role,
  fallbackName,
  className = '',
  showLabel = true,
}) => {
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [prevAddress, setPrevAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { showToast } = useNotification();

  if (address !== prevAddress) {
    setPrevAddress(address);
    setResolvedName(null);
  }

  const cachedVal = address ? (profileCache[address] || null) : null;

  useEffect(() => {
    if (!address || profileCache[address]) return;

    getUserProfile(address)
      .then((profile) => {
        if (profile?.name) {
          profileCache[address] = profile.name;
          setResolvedName(profile.name);
        }
      })
      .catch((err) => {
        console.error('Error fetching profile name:', err);
      });
  }, [address]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      showToast('Address copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showToast('Failed to copy address', 'error');
    }
  };

  // Determine the display name
  let displayName = resolvedName || cachedVal;
  if (!displayName && fallbackName) {
    const cleanFallback = fallbackName.trim();
    // Avoid using fallback strings that contain the wallet address pattern
    const isAddressPattern = cleanFallback.includes('(') || cleanFallback.includes('...') || (address && cleanFallback.includes(address.slice(0, 4)));
    if (!isAddressPattern) {
      displayName = cleanFallback;
    }
  }

  if (!displayName) {
    displayName = role === 'client' ? 'Client' : 'Freelancer';
  }

  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';

  return (
    <div className={`flex items-center gap-2 text-sm font-semibold text-white ${className}`}>
      {showLabel && (
        <span className="text-gray-400 font-medium">
          {role === 'client' ? 'Client:' : 'Freelancer:'}
        </span>
      )}
      <span className="text-white font-bold">{displayName}</span>
      {address && (
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md text-[11px] font-mono text-gray-300">
          <span>{shortAddress}</span>
          <button
            onClick={handleCopy}
            type="button"
            className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-1 focus-visible:ring-neoncyan focus-visible:outline-none cursor-pointer flex items-center justify-center"
            title="Copy address"
          >
            {copied ? (
              <Check className="w-3 h-3 text-neongreen" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
