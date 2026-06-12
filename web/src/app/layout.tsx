import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/context/WalletContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { OracleProvider } from '@/context/OracleContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import ProfileRegistrationModal from '@/components/ProfileRegistrationModal';

export const metadata: Metadata = {
  title: 'LikhaSpace | Decentralized Freelancing on Stellar',
  description: 'A trustless, zero-fee freelance marketplace for Filipino creative and technical professionals. Secured by Stellar Soroban smart contract escrows.',
  keywords: ['Stellar', 'Soroban', 'Freelance', 'Marketplace', 'Escrow', 'Smart Contracts', 'Philippines', 'Web3'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <NotificationProvider>
          <WalletProvider>
            <OracleProvider>
              <TransactionProvider>
                <Navbar />
                <ProfileRegistrationModal />
                <main className="grow">
                  {children}
                </main>
                <Footer />
              </TransactionProvider>
            </OracleProvider>
          </WalletProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
