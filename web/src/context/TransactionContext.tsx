'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToTxStatus } from '@/lib/stellarUtils';
import { useNotification } from './NotificationContext';
import { Loader2 } from 'lucide-react';

interface TransactionContextType {
  isProcessing: boolean;
  message: string;
}

const TransactionContext = createContext<TransactionContextType>({
  isProcessing: false,
  message: '',
});

export const useTransaction = () => useContext(TransactionContext);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const { showToast, showConfirm } = useNotification();

  // Handle recovery of pending transactions
  useEffect(() => {
    const pendingTx = window.localStorage.getItem('likha_pending_tx');
    if (pendingTx) {
      showConfirm(
        'Pending Transaction Found',
        'It looks like you had a transaction that was interrupted. Would you like to try recovering it?',
        async () => {
          try {
            showToast('Attempting to recover transaction...', 'info');
            const sponsorRes = await fetch('/api/sponsor-tx', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ txXdr: pendingTx }),
            });
            
            if (!sponsorRes.ok) {
              const errorText = await sponsorRes.text();
              throw new Error(`Sponsorship API failed: ${errorText}`);
            }
            
            const { hash } = await sponsorRes.json();
            
            showToast('Confirming on-chain...', 'info');
            const { pollTransaction } = await import('@/lib/stellarUtils');
            await pollTransaction(hash);
            
            window.localStorage.removeItem('likha_pending_tx');
            showToast('Transaction recovered and succeeded!', 'success');
            
            // Reload page to reflect new state
            window.location.reload();
          } catch (e: unknown) {
            console.error(e);
            const errMsg = e instanceof Error ? e.message : String(e);
            if (errMsg.includes('tx_bad_seq') || errMsg.includes('bad_seq')) {
              // Transaction already succeeded previously
              window.localStorage.removeItem('likha_pending_tx');
              showToast('Transaction was already processed successfully.', 'success');
              window.location.reload();
            } else {
              showToast(`Recovery failed: ${errMsg}`, 'error');
            }
          }
        }
      );
    }
  }, [showConfirm, showToast]);

  // Subscribe to transaction status updates
  useEffect(() => {
    const unsubscribe = subscribeToTxStatus((status) => {
      setIsProcessing(status.isProcessing);
      setMessage(status.message);
    });
    return () => unsubscribe();
  }, []);

  // Prevent accidental refresh while processing
  useEffect(() => {
    if (!isProcessing) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'A transaction is currently in progress. Refreshing may interrupt the transaction. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isProcessing]);

  return (
    <TransactionContext.Provider value={{ isProcessing, message }}>
      {children}
      
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="glass-card p-8 rounded-2xl border border-white/10 flex flex-col items-center gap-4 max-w-sm w-full mx-4 shadow-2xl">
            <Loader2 className="w-12 h-12 text-neoncyan animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-heading font-bold text-white mb-2">Processing Transaction</h3>
              <p className="text-sm text-gray-400">{message}</p>
            </div>
            <p className="text-xs text-red-400 mt-4 text-center font-semibold">
              Please do not refresh the page or close your browser.
            </p>
          </div>
        </div>
      )}
    </TransactionContext.Provider>
  );
};
