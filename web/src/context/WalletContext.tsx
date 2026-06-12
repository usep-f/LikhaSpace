'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, deleteDoc, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNotification } from './NotificationContext';

export type UserRole = 'artist' | 'client' | 'mediator';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  title?: string;
  bio?: string;
  category?: string;
  careerPath?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  portfolio?: string;
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
  clearError: () => void;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

const TIMEOUT_MS = 5000;
const STORAGE_ADDR_KEY = 'likhaspace_wallet_address';
const STORAGE_ROLE_KEY = 'likhaspace_user_role';

const mapFirebaseToProfile = (data: DocumentData): UserProfile => ({
  name: data.name || '',
  email: data.email || '',
  phone: data.phone || '',
  title: data.title || '',
  bio: data.bio || '',
  category: data.category || '',
  careerPath: data.careerPath || '',
  github: data.github || '',
  linkedin: data.linkedin || '',
  twitter: data.twitter || '',
  portfolio: data.portfolio || '',
});

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
        if (data.name) {
          setUserProfile(mapFirebaseToProfile(data));
          setIsRegistered(true);
        } else {
          setUserProfile(null);
          setIsRegistered(false);
        }
        if (data.role) {
          const fetchedRole = data.role as UserRole;
          setRole(fetchedRole);
          localStorage.setItem(STORAGE_ROLE_KEY, fetchedRole);
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
    const loadSession = async () => {
      const savedAddress = localStorage.getItem(STORAGE_ADDR_KEY);
      const savedRole = localStorage.getItem(STORAGE_ROLE_KEY) as UserRole | null;
      
      if (savedRole) {
        setRole(savedRole);
      }
      if (savedAddress) {
        setAddress(savedAddress);
        setIsConnected(true);
        await fetchProfileFromFirebase(savedAddress);
      }
      setIsLoading(false);
    };
    
    void loadSession();
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

  const fetchFreighterAddress = async () => {
    const freighter = await import('@stellar/freighter-api');
    const conn = await withTimeout(
      freighter.isConnected(),
      'Connection timed out checking for Freighter extension.'
    );
    if (!conn || !conn.isConnected) {
      throw new Error('Freighter wallet extension was not detected. Please install it.');
    }
    return withTimeout(
      freighter.getAddress(),
      'Request timed out waiting for wallet response.'
    );
  };

  // Connect wallet through Freighter API
  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const info = await fetchFreighterAddress();
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

  // Auto-disconnect unregistered users who refresh during onboarding
  useEffect(() => {
    if (!isLoading && isConnected && !isRegistered && !hasAttemptedLogin) {
      const timer = setTimeout(() => {
        disconnectWallet();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isConnected, isRegistered, hasAttemptedLogin]);


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
      const payload: Record<string, unknown> = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };
      if (role) {
        payload.role = role;
      }
      await setDoc(docRef, payload, { merge: true });
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
