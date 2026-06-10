import React, { useState, useEffect } from 'react';
import { StepProps } from './types';
import { useWallet } from '@/context/WalletContext';
import { fetchWalletStats, verifyWallet, WalletStats, DEFAULT_RULES } from '@/lib/stellarVerification';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const StepDetails: React.FC<StepProps> = ({ formData, updateData, onNext, onBack }) => {
  const { address } = useWallet();
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ isVerified: boolean; reasons: string[] } | null>(null);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void checkWallet();
  }, [checkWallet]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData({ [e.target.name]: e.target.value });
  };

  const isValid = formData.name.trim() !== '' && formData.email.trim() !== '' && formData.phone.trim() !== '' && verificationResult?.isVerified;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl font-bold text-white mb-2">Account Details</h2>
        <p className="text-sm text-gray-400">Enter your credentials to secure your profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200" placeholder="Juan Dela Cruz" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200" placeholder="juan@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Phone *</label>
            <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200" placeholder="+63 900 000 0000" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Wallet Verification</h3>
          <div className="p-5 rounded-xl glass-card border border-white/5 relative overflow-hidden">
            {isVerifying ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-sm text-slate-300">Verifying on-chain data...</span>
              </div>
            ) : verificationError ? (
              <div className="text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{verificationError}</span>
              </div>
            ) : stats && verificationResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Address</span>
                  <span className="font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">{address?.slice(0,4)}...{address?.slice(-4)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/5 p-2 rounded-lg text-center">
                    <div className="text-slate-400 text-xs mb-1">Balance</div>
                    <div className="font-mono text-white">{stats.balanceXLM} XLM</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg text-center">
                    <div className="text-slate-400 text-xs mb-1">Age</div>
                    <div className="font-mono text-white">{stats.accountAgeDays} d</div>
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg flex items-start gap-3 border ${verificationResult.isVerified ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {verificationResult.isVerified ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-medium mt-0.5">Wallet Verified Successfully</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Verification Failed</p>
                        <ul className="list-disc pl-4 space-y-1 text-xs opacity-90">
                          {verificationResult.reasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-700">
        <button onClick={onBack} className="px-6 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors">
          Back
        </button>
        <button 
          onClick={onNext} 
          disabled={!isValid}
          className={`px-8 py-2 rounded-lg font-semibold transition-all duration-200 ${isValid ? 'bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
