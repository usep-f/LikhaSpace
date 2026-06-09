'use client';

import React from 'react';
import { Shield, ExternalLink } from 'lucide-react';

const FooterLogo: React.FC = () => (
  <div>
    <div className="flex items-center space-x-2">
      <span className="font-heading text-lg font-bold tracking-wider text-hotpink text-glow-pink">
        LikhaSpace
      </span>
    </div>
    <p className="mt-2 text-xs text-gray-400 max-w-xs">
      Decentralized freelancing marketplace for Filipino creative and technical professionals.
    </p>
  </div>
);

const FooterLinks: React.FC = () => (
  <div className="flex space-x-12">
    <div>
      <h3 className="text-xs font-bold text-hotpink uppercase tracking-widest font-heading mb-3">
        Categories
      </h3>
      <ul className="space-y-2 text-xs text-gray-400">
        <li><span className="hover:text-neoncyan transition-colors duration-150 cursor-pointer">Music & Audio</span></li>
        <li><span className="hover:text-neoncyan transition-colors duration-150 cursor-pointer">Design & Art</span></li>
        <li><span className="hover:text-neoncyan transition-colors duration-150 cursor-pointer">Development</span></li>
        <li><span className="hover:text-neoncyan transition-colors duration-150 cursor-pointer">Copywriting</span></li>
      </ul>
    </div>
    <div>
      <h3 className="text-xs font-bold text-neoncyan uppercase tracking-widest font-heading mb-3">
        Network
      </h3>
      <ul className="space-y-2 text-xs text-gray-400">
        <li>
          <a
            href="https://stellar.expert/explorer/testnet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-white transition-colors duration-150"
          >
            <span>Stellar Explorer</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </li>
        <li>
          <a
            href="https://soroban-testnet.stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-white transition-colors duration-150"
          >
            <span>Soroban RPC</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </li>
      </ul>
    </div>
  </div>
);

export const Footer: React.FC = () => {
  return (
    <footer className="bg-obsidian border-t border-white/5 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-between">
          <FooterLogo />
          <div className="flex justify-end">
            <FooterLinks />
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500">
          <p>© {new Date().getFullYear()} LikhaSpace. All rights reserved.</p>
          <div className="flex items-center space-x-1 mt-4 sm:mt-0">
            <Shield className="w-3.5 h-3.5 text-neongreen" />
            <span>Secured by Stellar Soroban Escrow Smart Contracts</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
