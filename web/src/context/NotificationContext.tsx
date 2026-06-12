'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ModalConfig {
  title: string;
  message: string;
  isConfirm: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface NotificationContextProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void;
  showAlert: (title: string, message: string) => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const showLoading = useCallback((message: string = 'Please wait...') => {
    setLoadingMessage(message);
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingMessage(null);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    setModal({
      title,
      message,
      isConfirm: true,
      onConfirm,
      confirmText,
      cancelText,
    });
  }, []);

  const showAlert = useCallback((title: string, message: string) => {
    setModal({
      title,
      message,
      isConfirm: false,
      confirmText: 'OK',
    });
  }, []);

  const closeModal = () => {
    setModal(null);
  };

  const handleConfirm = () => {
    if (modal?.onConfirm) {
      modal.onConfirm();
    }
    closeModal();
  };

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm, showAlert, showLoading, hideLoading }}>
      {children}

      {/* Global Toast Stack */}
      <div className="fixed bottom-4 right-4 z-999 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? XCircle : Info;
          const bgClass = toast.type === 'success' 
            ? 'bg-slate-900 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
            : toast.type === 'error'
              ? 'bg-slate-900 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
              : 'bg-slate-900 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
          
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md pointer-events-auto transition-all duration-300 animate-slide-in ${bgClass}`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm font-medium leading-relaxed font-sans text-slate-200">
                {toast.message}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Global Modal Overlay */}
      {modal && (
        <div className="fixed inset-0 z-998 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start gap-4 flex-1">
              <div className={`p-2 rounded-lg shrink-0 ${modal.isConfirm ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                {modal.isConfirm ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
              </div>
              <div className="space-y-2 overflow-y-auto">
                <h3 className="text-lg font-bold text-white font-heading">
                  {modal.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap pr-2">
                  {modal.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 shrink-0">
              {modal.isConfirm && (
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:outline-none"
                >
                  {modal.cancelText}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:outline-none ${
                  modal.isConfirm 
                    ? 'bg-amber-600 hover:bg-amber-500 focus-visible:ring-amber-500' 
                    : 'bg-cyan-600 hover:bg-cyan-500 focus-visible:ring-cyan-500'
                }`}
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Loading Overlay */}
      {loadingMessage && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-16 h-16 border-4 border-neoncyan border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(0,243,255,0.4)]"></div>
          <h2 className="text-xl font-heading font-bold text-white mb-2">Transaction in Progress</h2>
          <p className="text-sm text-neoncyan font-bold">{loadingMessage}</p>
          <div className="mt-6 p-4 bg-slate-900 border border-slate-700/50 rounded-xl max-w-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed font-sans text-left">
              Please wait for the wallet signature and network confirmation. <strong className="text-amber-500">Do not refresh or close this tab</strong> to avoid misinputs or failed transactions.
            </p>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
