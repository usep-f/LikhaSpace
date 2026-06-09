export interface Testimonial {
  id: string;
  clientName: string;
  rating: number;
  text: string;
}

export interface FreelancerProfile {
  address: string;
  name: string;
  title: string;
  bio: string;
  totalEarnedXLM: number;
  projectsCompleted: number;
  averageRating: number;
  testimonials: Testimonial[];
}

export interface Gig {
  id: string;
  freelancerAddress: string;
  freelancerName: string;
  title: string;
  category: 'music' | 'design' | 'dev' | 'copywriting';
  description: string;
  priceUSD: number;
  upfrontPercentage: number;
  tags: string[];
  status: 'active' | 'occupied'; // active = visible in marketplace, occupied = currently working on a client request
  rating?: number; // average rating specifically for this gig
  reviewsCount?: number;
}

export interface ChangelogEntry {
  id: string;
  timestamp: string;
  message: string;
}

export interface Order {
  id: string;
  gigId: string;
  clientAddress: string;
  clientName: string;
  freelancerAddress: string;
  status: 'pending_acceptance' | 'denied' | 'escrow_funded' | 'delivered' | 'completed' | 'disputed';
  priceUSD: number;
  upfrontPercentage: number;
  denialMessage?: string;

  // Deliverables
  deliverablesLink?: string;
  deliverableNotes?: string;

  // Progress & History
  progressPercentage: number;
  changelogs: ChangelogEntry[];

  // Chat
  chatMessages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  senderAddress: string;
  text: string;
  timestamp: string;
}

export const mockProfiles: Record<string, FreelancerProfile> = {
  'GDX7...R39P': {
    address: 'GDX7...R39P',
    name: 'Karla Garcia',
    title: 'Cyberpunk UI/UX Specialist',
    bio: 'I specialize in creating stunning neon-drenched, glassmorphic interfaces for Web3 and gaming projects.',
    totalEarnedXLM: 12500,
    projectsCompleted: 24,
    averageRating: 4.9,
    testimonials: [
      { id: 't1', clientName: 'Sulo Games', rating: 5, text: 'Absolutely nailed the aesthetic we were looking for!' },
      { id: 't2', clientName: 'Neon Manila', rating: 4.8, text: 'Great communication and super fast delivery.' }
    ]
  },
  'GCBA...L67T': {
    address: 'GCBA...L67T',
    name: 'Bayan Tech',
    title: 'Soroban Smart Contract Developer',
    bio: 'Rust expert building secure and optimized smart contracts on the Stellar network.',
    totalEarnedXLM: 45000,
    projectsCompleted: 12,
    averageRating: 5.0,
    testimonials: [
      { id: 't3', clientName: 'Defi Protocol', rating: 5, text: 'Flawless contract implementation, passed audit with zero issues.' }
    ]
  }
};

export const mockGigs: Gig[] = [
  {
    id: 'gig-1',
    freelancerAddress: 'GDX7...R39P',
    freelancerName: 'Karla Garcia',
    title: 'I will design a Cyberpunk Portfolio Landing Page in Figma',
    category: 'design',
    description: 'I will create a stunning landing page mockup utilizing glassmorphism, glowing pink/cyan borders, and custom space illustrations. Perfect for Web3 profiles.',
    priceUSD: 500,
    upfrontPercentage: 20,
    tags: ['figma', 'glassmorphism', 'cyberpunk UI'],
    status: 'active',
    rating: 4.9,
    reviewsCount: 15
  },
  {
    id: 'gig-2',
    freelancerAddress: 'GBC2...9A4F',
    freelancerName: 'Sulo Audio',
    title: 'I will compose a Synthwave Background Score loop',
    category: 'music',
    description: 'Looking for nostalgic 80s vibes? I will produce a retro-futuristic synthwave soundtrack loop (up to 2 minutes) for your indie game or stream.',
    priceUSD: 350,
    upfrontPercentage: 30,
    tags: ['synthwave', 'game audio', 'looping tracks'],
    status: 'active',
    rating: 4.7,
    reviewsCount: 8
  },
  {
    id: 'gig-3',
    freelancerAddress: 'GCBA...L67T',
    freelancerName: 'Bayan Tech',
    title: 'I will write and deploy a Soroban Escrow Smart Contract',
    category: 'dev',
    description: 'I will write a secure Rust smart contract on Stellar/Soroban tailored to your specific escrow, payment, or token distribution needs.',
    priceUSD: 800,
    upfrontPercentage: 40,
    tags: ['rust', 'stellar sdk', 'soroban'],
    status: 'active',
    rating: 5.0,
    reviewsCount: 12
  },
  {
    id: 'gig-4',
    freelancerAddress: 'GAA5...H12W',
    freelancerName: 'Tinta Writes',
    title: 'I will write SEO Copywriting for your Web3 Project',
    category: 'copywriting',
    description: 'I will write engaging, SEO-optimized descriptions and press releases to boost your dApp or NFT collection visibility. (800 words)',
    priceUSD: 250,
    upfrontPercentage: 10,
    tags: ['seo writing', 'creative copy', 'press release'],
    status: 'active',
    rating: 4.5,
    reviewsCount: 22
  },
  {
    id: 'gig-5',
    freelancerAddress: 'GBB1...M98L',
    freelancerName: 'DJ Neon',
    title: 'I will illustrate a Vaporwave Album Cover',
    category: 'design',
    description: 'I will create a nostalgic vaporwave/synthwave album cover including elements like a futuristic city skyline, palm trees, and a grid sun.',
    priceUSD: 180,
    upfrontPercentage: 50,
    tags: ['album cover', 'vaporwave', 'illustration'],
    status: 'occupied',
    rating: 4.8,
    reviewsCount: 31
  }
];

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    gigId: 'gig-5',
    clientAddress: 'GCLIENT...123',
    clientName: 'Retro Records',
    freelancerAddress: 'GBB1...M98L',
    status: 'delivered',
    priceUSD: 180,
    upfrontPercentage: 50,
    deliverablesLink: 'https://figma.com/file/mock-album-cover',
    deliverableNotes: 'Here is the final render! Let me know if you need the raw files.',
    progressPercentage: 100,
    changelogs: [
      { id: 'cl1', timestamp: '2023-10-25T14:00:00Z', message: 'Started sketching out the skyline silhouette.' },
      { id: 'cl2', timestamp: '2023-10-26T10:30:00Z', message: 'Completed the base vector art. Working on the neon glowing effects and palm trees now.' },
      { id: 'cl3', timestamp: '2023-10-27T09:15:00Z', message: 'Added the grid sun and finalized the typography placement. Preparing final export.' },
      { id: 'cl4', timestamp: '2023-10-27T15:20:00Z', message: 'Final deliverable submitted for review.' }
    ],
    chatMessages: [
      { id: 'm1', senderAddress: 'GCLIENT...123', text: 'Hey, I love your work! Can we do a Manila skyline for the cover?', timestamp: '2023-10-25T10:00:00Z' },
      { id: 'm2', senderAddress: 'GBB1...M98L', text: 'Absolutely! I will get started right away now that the escrow is funded.', timestamp: '2023-10-25T10:05:00Z' }
    ]
  },
  {
    id: 'order-2',
    gigId: 'gig-1',
    clientAddress: 'GCLIENT...456',
    clientName: 'Crypto Startup',
    freelancerAddress: 'GDX7...R39P',
    status: 'escrow_funded',
    priceUSD: 500,
    upfrontPercentage: 20,
    progressPercentage: 45,
    changelogs: [
      { id: 'cl5', timestamp: '2023-10-26T09:00:00Z', message: 'Gathering moodboard references and setting up the Figma design system.' },
      { id: 'cl6', timestamp: '2023-10-26T16:45:00Z', message: 'Finished the wireframing. Moving on to high-fidelity glassmorphism components.' }
    ],
    chatMessages: [
      { id: 'm3', senderAddress: 'GCLIENT...456', text: 'Hi Karla, we need this done within 5 days, is that possible?', timestamp: '2023-10-26T08:00:00Z' }
    ]
  }
];
