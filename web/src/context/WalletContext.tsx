'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNotification } from './NotificationContext';

export type UserRole = 'artist' | 'client';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  title?: string;
  bio?: string;
}

interface WalletContextProps {
  address: string | null;
  role: UserRole | null;
  userProfile: UserProfile | null;
  isRegistered: boolean;
  isConnected: boolean;
  isLoading: boolean;
  hasAttemptedLogin: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  selectRole: (role: UserRole) => void;
  registerProfile: (profile: UserProfile) => Promise<void>;
  deleteProfile: () => Promise<void>;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useNotification();

  // Fetch user profile and sync sandbox rules from Firebase
  const fetchProfileFromFirebase = useCallback(async (publicKey: string) => {
    try {
      const docRef = doc(db, 'users', publicKey);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // If it's a soft-deleted profile, PII fields will be empty strings
        if (data.name) {
          const profile: UserProfile = {
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            title: data.title || '',
            bio: data.bio || '',
          };
          setUserProfile(profile);
          setIsRegistered(true);
        } else {
          setUserProfile(null);
          setIsRegistered(false);
        }
        
        // verificationRules from document are bypassed to use static global rules
        if (data.role) {
          setRole(data.role as UserRole);
        }
      } else {
        setUserProfile(null);
        setIsRegistered(false);
      }
    } catch (err: unknown) {
      console.error('Error fetching profile from Firebase:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    }
  }, []);

  // Load persisted session
  useEffect(() => {
    const savedAddress = localStorage.getItem(STORAGE_ADDR_KEY);
    const savedRole = localStorage.getItem(STORAGE_ROLE_KEY) as UserRole | null;
    
    setTimeout(() => {
      if (savedRole) {
        setRole(savedRole);
      }
      if (savedAddress) {
        setAddress(savedAddress);
        setIsConnected(true);
        void fetchProfileFromFirebase(savedAddress);
      }
      setIsLoading(false);
    }, 0);
  }, [fetchProfileFromFirebase]);

  const handleWalletSuccess = useCallback((publicKey: string) => {
    setAddress(publicKey);
    setIsConnected(true);
    localStorage.setItem(STORAGE_ADDR_KEY, publicKey);
    setError(null);
    void fetchProfileFromFirebase(publicKey);
  }, [fetchProfileFromFirebase]);

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
        setHasAttemptedLogin(true);
        handleWalletSuccess(info.address);
      } else {
        throw new Error('No public key returned from Freighter. Is it unlocked?');
      }
    } catch (err: unknown) {
      console.error('Wallet connection error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Freighter wallet.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAddress(null);
    setRole(null);
    setUserProfile(null);
    setIsRegistered(false);
    setIsConnected(false);
    localStorage.removeItem(STORAGE_ADDR_KEY);
    localStorage.removeItem(STORAGE_ROLE_KEY);
  };

  // Set user role
  const selectRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem(STORAGE_ROLE_KEY, newRole);
  };

  const registerProfile = async (profile: UserProfile) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, 'users', address);
      await setDoc(docRef, {
        ...profile,
        role,
        updatedAt: new Date().toISOString(),
      });
      setUserProfile(profile);
      setIsRegistered(true);
    } catch (err: unknown) {
      console.error('Error registering profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to register profile in database');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProfile = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, 'users', address);
      // Hard-delete: completely remove the document to comply with Web3 / GDPR standards
      await deleteDoc(docRef);
      
      setAddress(null);
      setRole(null);
      setUserProfile(null);
      setIsRegistered(false);
      setIsConnected(false);
      localStorage.removeItem(STORAGE_ADDR_KEY);
      localStorage.removeItem(STORAGE_ROLE_KEY);
    } catch (err: unknown) {
      console.error('Error soft-deleting profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete profile from database');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // updateVerificationRules is removed as rules are now codebase-global

  // Setup simulated wallet connection (for local demo/testing)
  const simulateWallet = () => {
    const mockAddress = 'GCBC...SIMULATED...DEMO...KEY';
    setHasAttemptedLogin(true);
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
        userProfile,
        isRegistered,
        isConnected,
        isLoading,
        hasAttemptedLogin,
        error,
        connectWallet,
        disconnectWallet,
        selectRole,
        registerProfile,
        deleteProfile,
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
