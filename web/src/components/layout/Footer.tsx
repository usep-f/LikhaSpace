'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ExternalLink } from 'lucide-react';
import { GithubIcon, TwitterIcon } from '@/components/onboarding/BrandIcons';

const FooterLogo: React.FC = () => (
  <div className="flex flex-col space-y-3">
    <Link
      href="/"
      className="flex items-center space-x-2 cursor-pointer group focus-visible:ring-2 focus-visible:ring-neoncyan focus-visible:outline-none rounded"
    >
      <div className="w-8 h-8 rounded-lg neon-border-pink flex items-center justify-center bg-violet-dark/80 group-hover:shadow-[0_0_12px_rgba(255,0,127,0.4)] transition-all duration-200">
        <span className="text-hotpink font-heading font-bold text-lg text-glow-pink">L</span>
      </div>
      <span className="font-heading text-xl font-bold tracking-wider text-glow-pink text-hotpink group-hover:text-white transition-colors duration-200">
        LikhaSpace
      </span>
    </Link>
    <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
      Decentralized freelancing marketplace for Filipino creative and technical professionals.
    </p>
  </div>
);

const PlatformColumn: React.FC = () => (
  <div>
    <h3 className="text-xs font-bold text-hotpink uppercase tracking-widest font-heading mb-3">
      Platform
    </h3>
    <ul className="space-y-2 text-xs text-gray-400">
      <li>
        <Link
          href="/gigs"
          className="hover:text-neoncyan hover:text-glow-cyan transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-neoncyan focus-visible:outline-none rounded px-1 -mx-1"
        >
          Marketplace
        </Link>
      </li>
      <li>
        <Link
          href="/#how-it-works"
          className="hover:text-neoncyan hover:text-glow-cyan transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-neoncyan focus-visible:outline-none rounded px-1 -mx-1"
        >
          How It Works
        </Link>
      </li>
      <li>
        <Link
          href="/#faq"
          className="hover:text-neoncyan hover:text-glow-cyan transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-neoncyan focus-visible:outline-none rounded px-1 -mx-1"
        >
          FAQs
        </Link>
      </li>
    </ul>
  </div>
);

const LegalColumn: React.FC = () => (
  <div>
    <h3 className="text-xs font-bold text-neoncyan uppercase tracking-widest font-heading mb-3">
      Legal
    </h3>
    <ul className="space-y-2 text-xs text-gray-400">
      {[
        { name: 'Terms of Service' },
        { name: 'Privacy Policy' },
        { name: 'Soroban License' },
        { name: 'Escrow Dispute Rules' },
      ].map((item) => (
        <li key={item.name}>
          <span className="hover:text-white hover:text-glow-cyan transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-neoncyan focus-visible:outline-none rounded px-1 -mx-1 select-none">
            {item.name}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const NetworkColumn: React.FC = () => (
  <div>
    <h3 className="text-xs font-bold text-neongreen uppercase tracking-widest font-heading mb-3">
      Network & Devs
    </h3>
    <ul className="space-y-2 text-xs text-gray-400">
      {[
        { name: 'Stellar Explorer', href: 'https://stellar.expert/explorer/testnet' },
        { name: 'Soroban Docs', href: 'https://developers.stellar.org/docs/smart-contracts' },
        { name: 'Freighter Wallet', href: 'https://www.freighter.link/' },
        {
          name: 'Friendbot Faucet',
          href: 'https://laboratory.stellar.org/#account-creator?network=testnet',
        },
      ].map((item) => (
        <li key={item.name}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-white transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-neongreen focus-visible:outline-none rounded px-1 -mx-1"
          >
            <span>{item.name}</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const DiscordIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107 14.361 14.361 0 0 0 1.224 1.993.077.077 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
  </svg>
);

const SocialLinks: React.FC = () => (
  <div className="flex space-x-4">
    <a
      href="https://github.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-500 hover:text-neoncyan hover:text-glow-cyan transition-all duration-200 cursor-pointer p-1.5 rounded-lg hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-neoncyan focus-visible:outline-none"
      aria-label="GitHub"
    >
      <GithubIcon className="w-4 h-4" />
    </a>
    <a
      href="https://twitter.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-500 hover:text-hotpink hover:text-glow-pink transition-all duration-200 cursor-pointer p-1.5 rounded-lg hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-hotpink focus-visible:outline-none"
      aria-label="Twitter"
    >
      <TwitterIcon className="w-4 h-4" />
    </a>
    <a
      href="https://discord.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-500 hover:text-neongreen hover:text-glow-green transition-all duration-200 cursor-pointer p-1.5 rounded-lg hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-neongreen focus-visible:outline-none"
      aria-label="Discord"
    >
      <DiscordIcon className="w-4 h-4" />
    </a>
  </div>
);

const SecurityBadge: React.FC = () => (
  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-neongreen/5 border border-neongreen/20">
    <Shield className="w-3.5 h-3.5 text-neongreen animate-pulse" />
    <span className="text-[10px] text-gray-400 font-heading font-medium tracking-wide">
      Secured by Stellar Soroban Escrow Smart Contracts
    </span>
  </div>
);

export const Footer: React.FC = () => {
  return (
    <footer className="bg-obsidian border-t border-white/5 py-12 mt-auto w-full relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <FooterLogo />
          <PlatformColumn />
          <LegalColumn />
          <NetworkColumn />
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-gray-500">
          <p>© {new Date().getFullYear()} LikhaSpace. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
            <SecurityBadge />
            <SocialLinks />
          </div>
        </div>
      </div>
    </footer>
  );
};

