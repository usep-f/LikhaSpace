'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, deleteDoc, DocumentData, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useNotification } from './NotificationContext';
import { loginWithStellar } from '../lib/auth';
import { StellarWalletsKit } from '../lib/walletKit';

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
  const [role, setRole] = useState<UserRole | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_ROLE_KEY) as UserRole | null;
    }
    return null;
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useNotification();

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

  // Listen to Firebase Auth state to load and persist session natively
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userAddress = firebaseUser.uid;
        setAddress(userAddress);
        setIsConnected(true);
        setError(null);
        await fetchProfileFromFirebase(userAddress);
      } else {
        setAddress(null);
        setRole(null);
        setUserProfile(null);
        setIsRegistered(false);
        setIsConnected(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfileFromFirebase]);

  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { address: walletAddr } = await StellarWalletsKit.authModal();
      if (walletAddr) {
        setHasAttemptedLogin(true);
        await loginWithStellar(walletAddr);
      } else {
        throw new Error('No public key returned from wallet.');
      }
    } catch (err: unknown) {
      console.error('Wallet connection error:', err);
      let errMsg = 'Failed to connect wallet.';
      if (err instanceof Error) {
        errMsg = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errMsg = String((err as Record<string, unknown>).message);
      }
      if (errMsg !== 'The user closed the modal.') {
        setError(errMsg);
        showToast(errMsg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    void signOut(auth).catch(() => {});
    setAddress(null);
    setRole(null);
    setUserProfile(null);
    setIsRegistered(false);
    setIsConnected(false);
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
      await deleteDoc(docRef);

      const gigsQuery = query(collection(db, 'gigs'), where('freelancerAddress', '==', address));
      const gigsSnap = await getDocs(gigsQuery);
      
      const deletePromises = gigsSnap.docs.map((docItem) => deleteDoc(docItem.ref));
      await Promise.all(deletePromises);

      disconnectWallet();
    } catch (err: unknown) {
      console.error('Error soft-deleting profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete profile from database');
      throw err;
    } finally {
      setIsLoading(false);
    }
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
