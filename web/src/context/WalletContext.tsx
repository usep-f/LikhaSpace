'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'artist' | 'client';

interface WalletContextProps {
  address: string | null;
  role: UserRole | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  selectRole: (role: UserRole) => void;
  simulateWallet: () => void;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

const TIMEOUT_MS = 5000;
const STORAGE_ADDR_KEY = 'likhaspace_wallet_address';
const STORAGE_ROLE_KEY = 'likhaspace_user_role';

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load persisted session
  useEffect(() => {
    const savedAddress = localStorage.getItem(STORAGE_ADDR_KEY);
    const savedRole = localStorage.getItem(STORAGE_ROLE_KEY) as UserRole | null;
    
    // Defer state updates to avoid synchronous setState inside useEffect rule
    setTimeout(() => {
      if (savedAddress) {
        setAddress(savedAddress);
        setIsConnected(true);
        if (savedRole) {
          setRole(savedRole);
        }
      }
      setIsLoading(false);
    }, 0);
  }, []);

  const handleWalletSuccess = (publicKey: string) => {
    setAddress(publicKey);
    setIsConnected(true);
    localStorage.setItem(STORAGE_ADDR_KEY, publicKey);
    setError(null);
  };

  // Run a promise with a timeout limit
  const withTimeout = <T,>(promise: Promise<T>, message: string): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(message)), TIMEOUT_MS);
      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  // Connect wallet through Freighter API
  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Dynamic import of freighter api to prevent SSR crashes
      const freighter = await import('@stellar/freighter-api');
      
      const connectionInfo = await withTimeout(
        freighter.isConnected(),
        'Connection timed out checking for Freighter extension.'
      );

      if (!connectionInfo || !connectionInfo.isConnected) {
        throw new Error('Freighter wallet extension was not detected. Please install it or use the simulate button.');
      }

      const info = await withTimeout(
        freighter.getAddress(),
        'Request timed out waiting for wallet response.'
      );

      if (info && info.address) {
        handleWalletSuccess(info.address);
      } else {
        throw new Error('No public key returned from Freighter. Is it unlocked?');
      }
    } catch (err: unknown) {
      console.error('Wallet connection error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Freighter wallet.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAddress(null);
    setRole(null);
    setIsConnected(false);
    localStorage.removeItem(STORAGE_ADDR_KEY);
    localStorage.removeItem(STORAGE_ROLE_KEY);
  };

  // Set user role
  const selectRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem(STORAGE_ROLE_KEY, newRole);
  };

  // Setup simulated wallet connection (for local demo/testing)
  const simulateWallet = () => {
    const mockAddress = 'GCBC...SIMULATED...DEMO...KEY';
    handleWalletSuccess(mockAddress);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        role,
        isConnected,
        isLoading,
        error,
        connectWallet,
        disconnectWallet,
        selectRole,
        simulateWallet,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextProps => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
