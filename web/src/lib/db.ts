import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Order, Gig } from './mockGigs'; // Reusing the interfaces from mockGigs

/** GIGS */

export async function createGig(gig: Gig) {
  await setDoc(doc(db, 'gigs', gig.id), gig);
}

export async function getGig(gigId: string): Promise<Gig | null> {
  const docRef = doc(db, 'gigs', gigId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as Gig;
  }
  return null;
}

export async function getUserProfile(address: string) {
  const docRef = doc(db, 'users', address);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

export async function getFreelancerGigs(freelancerAddress: string): Promise<Gig[]> {
  const q = query(collection(db, 'gigs'), where('freelancerAddress', '==', freelancerAddress));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Gig);
}

export async function getAllGigs(): Promise<Gig[]> {
  const snap = await getDocs(collection(db, 'gigs'));
  return snap.docs.map(d => d.data() as Gig);
}

/** ORDERS */

export async function createOrder(order: Order) {
  await setDoc(doc(db, 'orders', order.id), order);
}

export async function getClientOrders(clientAddress: string): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('clientAddress', '==', clientAddress));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Order);
}

export async function getFreelancerOrders(freelancerAddress: string): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('freelancerAddress', '==', freelancerAddress));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Order);
}

export async function getDisputedOrders(): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('status', '==', 'disputed'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Order);
}

export async function updateOrderStatus(orderId: string, updates: Partial<Order>) {
  await updateDoc(doc(db, 'orders', orderId), updates);
}

/**
 * Helper to subscribe to orders in realtime so the UI updates automatically.
 */
export function subscribeToClientOrders(clientAddress: string, callback: (orders: Order[]) => void) {
  const q = query(collection(db, 'orders'), where('clientAddress', '==', clientAddress));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data() as Order));
  });
}

export function subscribeToFreelancerOrders(freelancerAddress: string, callback: (orders: Order[]) => void) {
  const q = query(collection(db, 'orders'), where('freelancerAddress', '==', freelancerAddress));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data() as Order));
  });
}
