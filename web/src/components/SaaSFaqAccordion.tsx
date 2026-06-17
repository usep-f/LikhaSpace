'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface SaaSFaqAccordionProps {
  className?: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How do Soroban smart contract escrows protect payments?',
    answer: 'When a client creates a project, their budget is converted to XLM and locked directly into a secure, audited smart contract on the Stellar blockchain. The client cannot retrieve the funds unless the freelancer fails to deliver or consents to a refund. Freelancers are protected by a 75% client kill-fee, ensuring they get compensated if the client cancels the contract mid-work.',
  },
  {
    question: 'Do I need cryptocurrency or a wallet to use LikhaSpace?',
    answer: 'Yes, both clients and freelancers require a Stellar wallet (such as Freighter) to interact with smart contracts, approve milestones, and receive/send payments. You can get free testnet XLM directly inside the app using the Friendbot faucet to test the platform.',
  },
  {
    question: 'What is the "on-chain reputation" score?',
    answer: 'Every completed milestone and project automatically writes data to the LikhaSpace reputation contract. This contract keeps track of the total number of projects completed, total volume earned, and average ratings. This profile remains immutable and resides completely on-chain, proving your skills without relying on centralized platform profiles.',
  },
  {
    question: 'How are disputes resolved?',
    answer: 'If there is a dispute regarding a deliverable, either party can trigger mediation. First, the client and freelancer can propose a split ratio of the locked funds. If they cannot agree, the dispute is escalated to an independent platform mediator who reviews the work history and resolves the dispute via the contract.',
  },
];

export const SaaSFaqAccordion: React.FC<SaaSFaqAccordionProps> = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-white/5">
      <div className="text-center mb-10">
        <h2 className="font-heading text-3xl font-bold text-white tracking-tight">
          Frequently Asked <span className="text-hotpink text-glow-pink">Questions</span>
        </h2>
        <p className="text-sm text-gray-400 mt-2">
          Learn how trustless freelance agreements work under the hood.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              onClick={() => toggleFaq(idx)}
              className="p-5 rounded-xl glass-card border border-white/5 hover:border-white/10 cursor-pointer transition-all duration-200"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
              >
                <span className="font-heading font-semibold text-sm text-white select-none">
                  {faq.question}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-hotpink" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isOpen ? 'max-h-40 mt-3 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-xs text-gray-400 leading-relaxed select-none">
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
