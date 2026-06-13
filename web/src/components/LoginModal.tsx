import React from 'react';
import { X, Wallet } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

interface LoginModalProps {
  onClose: () => void;
  message?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, message = "Please connect your Stellar wallet to continue." }) => {
  const { connectWallet, isLoading } = useWallet();

  const handleConnect = async () => {
    await connectWallet();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-violet-dark border border-white/10 rounded-2xl shadow-2xl p-6 text-center">
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
          <Wallet className="w-8 h-8 text-hotpink" />
        </div>

        <h2 className="text-xl font-heading font-bold text-white mb-2">Login Required</h2>
        <p className="text-xs text-gray-400 mb-6 px-4">
          {message}
        </p>

        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full py-3 rounded-lg bg-hotpink text-white font-heading font-bold text-sm uppercase tracking-wider hover:shadow-[0_0_15px_rgba(255,0,127,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              Connect to Stellar
            </>
          )}
        </button>
      </div>
    </div>
  );
};
