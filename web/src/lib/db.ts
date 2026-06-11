import { Order, Gig, MilestoneConfig, Testimonial } from './mockGigs';
import { uploadToIPFS, fetchFromIPFS } from './ipfs';
import { getProfileCID, setProfileCID, getRegisteredProfiles, getEscrowStateOnChain } from './contract';

export interface DecentralizedProfile {
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
  bio?: string;
  category?: string;
  careerPath?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  portfolio?: string;
  role?: string;
  gigs?: Gig[];
  orders?: Order[];
  updatedAt?: string;
  totalEarnedXLM?: number;
  projectsCompleted?: number;
  averageRating?: number;
  testimonials?: Testimonial[];
}

export async function getUserProfile(address: string): Promise<DecentralizedProfile | null> {
  try {
    const cid = await getProfileCID(address);
    if (!cid) return null;
    return await fetchFromIPFS<DecentralizedProfile>(cid);
  } catch (e) {
    console.error('Failed to get user profile:', e);
    return null;
  }
}

export async function registerUserProfile(
  address: string,
  profile: Partial<DecentralizedProfile>,
  role: string | null
): Promise<void> {
  const currentProfile = await getUserProfile(address) || {};
  const payload: DecentralizedProfile = {
    ...currentProfile,
    ...profile,
    updatedAt: new Date().toISOString(),
    role: role || undefined
  };
  const cid = await uploadToIPFS(payload);
  await setProfileCID(address, cid);
}

export async function deleteUserProfile(address: string): Promise<void> {
  await setProfileCID(address, '');
}

export async function createGig(gig: Gig): Promise<void> {
  const address = gig.freelancerAddress;
  const profile = await getUserProfile(address) || {
    name: gig.freelancerName || 'Anonymous',
    email: '',
    phone: '',
    title: '',
    bio: '',
    gigs: []
  };
  const gigs = profile.gigs || [];
  const updatedGigs = gigs.filter((g: Gig) => g.id !== gig.id);
  updatedGigs.push(gig);
  profile.gigs = updatedGigs;
  
  const cid = await uploadToIPFS(profile);
  await setProfileCID(address, cid);
}

export async function getGig(gigId: string): Promise<Gig | null> {
  const allGigs = await getAllGigs();
  return allGigs.find(g => g.id === gigId) || null;
}

export async function getFreelancerGigs(freelancerAddress: string): Promise<Gig[]> {
  const profile = await getUserProfile(freelancerAddress);
  return profile?.gigs || [];
}

export async function getAllGigs(): Promise<Gig[]> {
  try {
    const profilesMap = await getRegisteredProfiles();
    const entries = Array.from(profilesMap.entries()) as [string, string][];
    const promises = entries.map(async ([address, cid]) => {
      try {
        const profile = await fetchFromIPFS<DecentralizedProfile>(cid);
        if (profile && profile.gigs) {
          return profile.gigs.map((g: Gig) => ({
            ...g,
            freelancerAddress: address,
            freelancerName: profile.name || g.freelancerName || 'Anonymous'
          })) as Gig[];
        }
      } catch (e) {
        console.error(`Failed to fetch profile ${cid} from IPFS:`, e);
      }
      return [] as Gig[];
    });
    const results = await Promise.all(promises);
    return results.flat() as Gig[];
  } catch (e) {
    console.error('Failed to get all gigs:', e);
    return [];
  }
}

export async function createOrder(order: Order): Promise<void> {
  const address = order.clientAddress;
  const profile = await getUserProfile(address);
  if (!profile) throw new Error('Client profile not found');
  profile.orders = profile.orders || [];
  profile.orders.push(order);
  const cid = await uploadToIPFS(profile);
  await setProfileCID(address, cid);
}

async function mergeOrderChainState(order: Order): Promise<Order> {
  if (!order.txHash) return order;
  const chainState = await getEscrowStateOnChain(order.txHash);
  if (!chainState) return order;

  let mappedStatus = order.status;
  if (chainState.status === 1) {
    const activeMilestone = chainState.milestones.find(m => m.state === 'submitted');
    mappedStatus = activeMilestone ? 'delivered' : 'escrow_funded';
  } else if (chainState.status === 2) {
    mappedStatus = 'completed';
  } else if (chainState.status === 3) {
    mappedStatus = 'disputed';
  } else if (chainState.status === 4) {
    mappedStatus = 'completed';
  }

  const mergedMilestones = order.milestones?.map((m, idx) => {
    const chainM = chainState.milestones[idx];
    return chainM ? {
      ...m,
      revisionsUsed: chainM.revisionsUsed,
      state: chainM.state as MilestoneConfig['state']
    } : m;
  }) || [];

  return { ...order, status: mappedStatus, milestones: mergedMilestones };
}

interface ProfileOrdersContainer {
  clientAddr: string;
  profile: DecentralizedProfile;
  orders: Order[];
}

async function getAllProfilesOrders(): Promise<ProfileOrdersContainer[]> {
  const profilesMap = await getRegisteredProfiles();
  const list: ProfileOrdersContainer[] = [];
  for (const [addr, cid] of profilesMap.entries()) {
    const profile = await fetchFromIPFS<DecentralizedProfile>(cid);
    if (profile && profile.orders) {
      list.push({ clientAddr: addr, profile, orders: profile.orders });
    }
  }
  return list;
}

export async function getClientOrders(clientAddress: string): Promise<Order[]> {
  const profile = await getUserProfile(clientAddress);
  if (!profile || !profile.orders) return [];
  return Promise.all((profile.orders as Order[]).map(o => mergeOrderChainState(o)));
}

export async function getFreelancerOrders(freelancerAddress: string): Promise<Order[]> {
  const profilesOrders = await getAllProfilesOrders();
  const freelancerOrders = profilesOrders.flatMap(po => 
    po.orders.filter(o => o.freelancerAddress === freelancerAddress)
  );
  return Promise.all(freelancerOrders.map(o => mergeOrderChainState(o)));
}

export async function getDisputedOrders(): Promise<Order[]> {
  const profilesOrders = await getAllProfilesOrders();
  const allOrders = profilesOrders.flatMap(po => po.orders);
  const merged = await Promise.all(allOrders.map(o => mergeOrderChainState(o)));
  return merged.filter(o => o.status === 'disputed');
}

export async function updateOrderStatus(orderId: string, updates: Partial<Order>): Promise<void> {
  const profilesOrders = await getAllProfilesOrders();
  const match = profilesOrders.find(po => po.orders.some(o => o.id === orderId));
  if (match && match.profile.orders) {
    const idx = match.profile.orders.findIndex((o: Order) => o.id === orderId);
    match.profile.orders[idx] = { ...match.profile.orders[idx], ...updates };
    const cid = await uploadToIPFS(match.profile);
    await setProfileCID(match.clientAddr, cid);
  }
}

export function subscribeToClientOrders(clientAddress: string, callback: (orders: Order[]) => void) {
  let active = true;
  const poll = async () => {
    while (active) {
      try {
        const orders = await getClientOrders(clientAddress);
        if (active) callback(orders);
      } catch (e) {
        console.error('Subscription error:', e);
      }
      await new Promise(r => setTimeout(r, 6000));
    }
  };
  poll();
  return () => { active = false; };
}

export function subscribeToFreelancerOrders(freelancerAddress: string, callback: (orders: Order[]) => void) {
  let active = true;
  const poll = async () => {
    while (active) {
      try {
        const orders = await getFreelancerOrders(freelancerAddress);
        if (active) callback(orders);
      } catch (e) {
        console.error('Subscription error:', e);
      }
      await new Promise(r => setTimeout(r, 6000));
    }
  };
  poll();
  return () => { active = false; };
}
