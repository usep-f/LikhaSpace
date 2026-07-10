'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, deleteDoc, DocumentData, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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
  stellarAddress?: string;
}

interface WalletContextProps {
  uid: string | null;
  address: string | null;
  role: UserRole | null;
  userProfile: UserProfile | null;
  isRegistered: boolean;
  isConnected: boolean;
  isLoading: boolean;
  hasAttemptedLogin: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  linkWallet: () => Promise<void>;
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
  stellarAddress: data.stellarAddress || '',
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uid, setUid] = useState<string | null>(null);
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
  const { showToast, showLoading, hideLoading } = useNotification();

  const fetchProfileFromFirebase = useCallback(async (userUid: string) => {
    try {
      const docRef = doc(db, 'users', userUid);
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
        return data;
      } else {
        setUserProfile(null);
        setIsRegistered(false);
        return null;
      }
    } catch (err: unknown) {
      console.error('Error fetching profile from Firebase:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
      return null;
    }
  }, []);

  // Listen to Firebase Auth state to load and persist session natively
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const currentUid = firebaseUser.uid;
        setUid(currentUid);
        setIsConnected(true);
        setError(null);
        const profileData = await fetchProfileFromFirebase(currentUid);
        
        // Determine Stellar wallet address
        if (currentUid.length === 56 && currentUid.startsWith('G')) {
          setAddress(currentUid);
        } else if (profileData && profileData.stellarAddress) {
          setAddress(profileData.stellarAddress);
        } else {
          setAddress(null);
        }
      } else {
        setUid(null);
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

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      setHasAttemptedLogin(true);
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      console.error('Google login error:', err);
      let errMsg = 'Failed to login with Google.';
      if (err instanceof Error) {
        errMsg = err.message;
      }
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const linkWallet = async () => {
    if (!uid) {
      throw new Error('You must be logged in to link a wallet.');
    }
    setIsLoading(true);
    setError(null);
    try {
      const { address: walletAddr } = await StellarWalletsKit.authModal();
      if (!walletAddr) {
        throw new Error('No public key returned from wallet.');
      }

      showLoading('Verifying wallet link...');

      // Check 1: Is this wallet registered as a standalone account?
      const standaloneRef = doc(db, 'users', walletAddr);
      const standaloneSnap = await getDoc(standaloneRef);
      if (standaloneSnap.exists() && standaloneSnap.data().name) {
        throw new Error(
          'This Stellar wallet is already registered to a standalone account. Please log in directly with your wallet or choose a different wallet to link.'
        );
      }

      // Check 2: Is this wallet already linked to another user account?
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('stellarAddress', '==', walletAddr));
      const querySnap = await getDocs(q);
      const otherLinks = querySnap.docs.filter((docSnap) => docSnap.id !== uid);
      if (otherLinks.length > 0) {
        throw new Error(
          'This Stellar wallet is already registered to a standalone account. Please log in directly with your wallet or choose a different wallet to link.'
        );
      }

      // Perform link
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { stellarAddress: walletAddr }, { merge: true });

      setAddress(walletAddr);
      await fetchProfileFromFirebase(uid);
      showToast('Wallet successfully linked!', 'success');
    } catch (err: unknown) {
      console.error('Link wallet error:', err);
      let errMsg = 'Failed to link wallet.';
      if (err instanceof Error) {
        errMsg = err.message;
      }
      if (errMsg !== 'The user closed the modal.') {
        setError(errMsg);
        showToast(errMsg, 'error');
      }
      throw err;
    } finally {
      hideLoading();
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    void signOut(auth).catch(() => {});
    setUid(null);
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
    if (!uid) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, 'users', uid);
      const payload: Record<string, unknown> = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };
      if (role) {
        payload.role = role;
      }
      if (address && address !== uid) {
        payload.stellarAddress = address;
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
    if (!uid) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, 'users', uid);
      await deleteDoc(docRef);

      const gigsQuery = query(collection(db, 'gigs'), where('freelancerAddress', '==', address || uid));
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
        uid,
        address,
        role,
        userProfile,
        isRegistered,
        isConnected,
        isLoading,
        hasAttemptedLogin,
        error,
        connectWallet,
        loginWithGoogle,
        linkWallet,
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
