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
export interface MilestoneConfig {
  title: string;
  payoutUSD: number;
  maxRevisions: number;
  revisionsUsed?: number;
  state?: 'locked' | 'active' | 'submitted' | 'approved' | 'disputed';
  deliverablesLink?: string;
  deliverablesStoragePath?: string;
  deliverablesFileName?: string;
  deliverableNotes?: string;
}

export interface Gig {
  id: string;
  freelancerAddress: string;
  freelancerName: string;
  title: string;
  category: 'music' | 'design' | 'dev' | 'copywriting';
  description: string;
  priceUSD: number;
  tags: string[];
  status: 'active' | 'occupied' | 'paused'; // active = visible, occupied = working on it, paused = hidden by user
  rating?: number; // average rating specifically for this gig
  reviewsCount?: number;
  milestones?: MilestoneConfig[];
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
  status: 'pending_acceptance' | 'denied' | 'awaiting_funding' | 'escrow_funded' | 'delivered' | 'completed' | 'disputed' | 'settled_dispute' | 'mediation';
  priceUSD: number;
  denialMessage?: string;
  proposalText?: string;
  milestones?: MilestoneConfig[];
  currentMilestoneIdx?: number;
  hasSubmittedOnce?: boolean;

  // Deliverables
  deliverablesLink?: string;
  deliverableNotes?: string;

  // Progress & History
  progressPercentage: number;
  changelogs: ChangelogEntry[];

  // Chat
  chatMessages: ChatMessage[];

  // On-Chain Verification
  txHash?: string;

  // Rating/Review for completed orders
  review?: {
    rating: number;
    text: string;
  };
}

export interface ChatMessage {
  id: string;
  senderAddress: string;
  text: string;
  timestamp: string;
}

// Mock exports for testing/prototype fallback if needed:
// export const mockProfiles: Record<string, FreelancerProfile> = {};
// export const types: Gig[] = [];
// export const mockOrders: Order[] = [];
