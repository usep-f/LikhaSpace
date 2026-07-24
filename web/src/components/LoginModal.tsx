import React from 'react';
import { X, Wallet } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

interface LoginModalProps {
  onClose: () => void;
  message?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, message = "Please sign in to LikhaSpace to continue." }) => {
  const { connectWallet, loginWithGoogle, isLoading } = useWallet();

  const handleConnect = async () => {
    await connectWallet();
    onClose();
  };

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
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
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3 mb-1 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-heading font-bold text-sm uppercase tracking-wider hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="px-3 text-[10px] text-gray-500 uppercase font-bold tracking-widest">or</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full py-3 rounded-lg bg-hotpink text-white font-heading font-bold text-sm uppercase tracking-wider hover:shadow-[0_0_15px_rgba(255,0,127,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              Connect Freighter
            </>
          )}
        </button>
      </div>
    </div>
  );
};
