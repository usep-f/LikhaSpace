'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { fetchWalletStats, verifyWallet, WalletStats, DEFAULT_RULES } from '../lib/stellarVerification';
import { useNotification } from '../context/NotificationContext';

export default function ProfileRegistrationModal() {
  const { address, role, isRegistered, isConnected, registerProfile, hasAttemptedLogin } = useWallet();
  const { showToast } = useNotification();

  const [stats, setStats] = useState<WalletStats | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ isVerified: boolean; reasons: string[] } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    bio: '',
  });

  const checkWallet = React.useCallback(async () => {
    if (!address) return;
    setIsVerifying(true);
    setVerificationError(null);
    try {
      const fetchedStats = await fetchWalletStats(address);
      setStats(fetchedStats);
      const result = verifyWallet(fetchedStats, DEFAULT_RULES);
      setVerificationResult(result);
    } catch (err: unknown) {
      setVerificationError(err instanceof Error ? err.message : 'Failed to fetch wallet stats');
    } finally {
      setIsVerifying(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address && !isRegistered) {
      setTimeout(() => {
        void checkWallet();
      }, 0);
    }
  }, [isConnected, address, isRegistered, checkWallet]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationResult?.isVerified) {
      showToast("Wallet not verified. Please meet the requirements.", "error");
      return;
    }
    void registerProfile(formData);
  };

  // Only show if connected, address is loaded, role is selected, but not registered
  // AND the user explicitly pressed the login button this session (hasAttemptedLogin)
  if (!isConnected || !address || !role || isRegistered || !hasAttemptedLogin) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-100 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Complete Your Registration</h2>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wallet Verification Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Wallet Verification</h3>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Address: <span className="text-cyan-400 font-mono">{address.slice(0,6)}...{address.slice(-4)}</span></p>
              
              {isVerifying ? (
                <div className="animate-pulse flex space-x-2 items-center text-cyan-500">
                  <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying on-chain data...</span>
                </div>
              ) : verificationError ? (
                <div className="text-red-400 text-sm p-2 bg-red-400/10 rounded">{verificationError}</div>
              ) : stats && verificationResult ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-400">Balance:</div>
                    <div className="text-white font-mono">{stats.balanceXLM} XLM</div>
                    <div className="text-slate-400">Age:</div>
                    <div className="text-white font-mono">{stats.accountAgeDays} Days</div>
                    <div className="text-slate-400">Transactions:</div>
                    <div className="text-white font-mono">{stats.totalTransactions}</div>
                  </div>

                  <div className={`p-3 rounded-md flex items-start gap-2 ${verificationResult.isVerified ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {verificationResult.isVerified ? (
                      <>
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-sm font-medium">Wallet Verified</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div className="text-sm">
                          <p className="font-medium mb-1">Verification Failed</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {verificationResult.reasons.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="text-xs text-slate-500">
              * Verification helps prevent bot accounts and ensures you have the minimum XLM reserve to transact on Stellar.
            </div>
          </div>

          {/* Profile Form */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Profile Details</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone *</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="+1 234 567 8900" />
              </div>

              {role === 'artist' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Professional Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. 3D Animator" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Tell clients about your skills..." />
                  </div>
                </>
              )}

              <button 
                type="submit" 
                disabled={!verificationResult?.isVerified}
                className={`w-full py-2.5 rounded-md font-semibold transition-colors mt-4 ${verificationResult?.isVerified ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              >
                {verificationResult?.isVerified ? 'Complete Registration' : 'Awaiting Verification'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
