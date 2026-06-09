export interface Gig {
  id: string;
  title: string;
  category: 'music' | 'design' | 'dev' | 'copywriting';
  clientName: string;
  clientAddress: string;
  description: string;
  budgetUSD: number;
  status: 'open' | 'active' | 'completed' | 'disputed';
  upfrontPercentage: number;
  tags: string[];
}

export const mockGigs: Gig[] = [
  {
    id: 'gig-1',
    title: 'Synthwave Background Score for Indie Game',
    category: 'music',
    clientName: 'Sulo Games Studio',
    clientAddress: 'GBC2...9A4F',
    description: 'Looking for a retro-futuristic synthwave soundtrack with 4 loops (Menu, Level 1, Boss Fight, Credits) for our upcoming 2D platformer. Must have nostalgic 80s vibes.',
    budgetUSD: 350,
    status: 'open',
    upfrontPercentage: 30,
    tags: ['synthwave', 'game audio', 'looping tracks']
  },
  {
    id: 'gig-2',
    title: 'Cyberpunk Portfolio Landing Page Design',
    category: 'design',
    clientName: 'Karla Garcia (Artist)',
    clientAddress: 'GDX7...R39P',
    description: 'Need a stunning landing page mockup designed in Figma. The design should utilize glassmorphism, glowing pink/cyan borders, and custom space illustrations.',
    budgetUSD: 500,
    status: 'open',
    upfrontPercentage: 20,
    tags: ['figma', 'glassmorphism', 'cyberpunk UI']
  },
  {
    id: 'gig-3',
    title: 'Soroban Escrow Smart Contract Integration',
    category: 'dev',
    clientName: 'Bayan Tech Ventures',
    clientAddress: 'GCBA...L67T',
    description: 'We need a React hook that simulates, signs, and polls transactions for a Soroban Rust contract. Wallet connection through Freighter is already completed.',
    budgetUSD: 800,
    status: 'open',
    upfrontPercentage: 40,
    tags: ['rust', 'stellar sdk', 'soroban']
  },
  {
    id: 'gig-4',
    title: 'SEO Copywriting for Tech-Noir Web Comic',
    category: 'copywriting',
    clientName: 'Tinta Publications',
    clientAddress: 'GAA5...H12W',
    description: 'Write engaging SEO-optimized descriptions and press releases for our new tech-noir cybernetic comic series launch. 5 articles total, 800 words each.',
    budgetUSD: 250,
    status: 'open',
    upfrontPercentage: 10,
    tags: ['seo writing', 'creative copy', 'press release']
  },
  {
    id: 'gig-5',
    title: 'Vaporwave Album Cover Art Illustration',
    category: 'design',
    clientName: 'DJ Neon Manila',
    clientAddress: 'GBB1...M98L',
    description: 'Looking for a graphic designer to create a nostalgic vaporwave/synthwave album cover including a futuristic Manila skyline, palm trees, and grid sun.',
    budgetUSD: 180,
    status: 'active',
    upfrontPercentage: 50,
    tags: ['album cover', 'vaporwave', 'manila skyline']
  },
  {
    id: 'gig-6',
    title: 'Stellar USDC Payment Portal Development',
    category: 'dev',
    clientName: 'Sari-Sari Digital',
    clientAddress: 'GCS2...Q87R',
    description: 'Build a Next.js component to receive Stellar USDC payments. Checks trustlines before submitting. Uses the testnet Circle USDC token.',
    budgetUSD: 600,
    status: 'completed',
    upfrontPercentage: 25,
    tags: ['stellar payment', 'usdc', 'trustline']
  }
];
