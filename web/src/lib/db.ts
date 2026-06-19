import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, onSnapshot, arrayUnion, orderBy, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Order, Gig, Notification } from './types'; // Reusing the interfaces from types

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

export async function updateGig(gigId: string, updates: Partial<Gig>) {
  await updateDoc(doc(db, 'gigs', gigId), updates);
}

export async function deleteGig(gigId: string) {
  await deleteDoc(doc(db, 'gigs', gigId));
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
  const q = query(collection(db, 'orders'), where('status', 'in', ['disputed', 'mediation']));
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

export function subscribeToMediatorOrders(callback: (orders: Order[]) => void) {
  const q = query(collection(db, 'orders'), where('status', 'in', ['disputed', 'mediation', 'settled_dispute']));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data() as Order));
  });
}

/** CHAT */

export async function sendChatMessage(orderId: string, senderAddress: string, text: string) {
  const orderRef = doc(db, 'orders', orderId);
  const orderSnap = await getDoc(orderRef);
  if (orderSnap.exists()) {
    const order = orderSnap.data() as Order;
    const recipientAddress = order.freelancerAddress === senderAddress ? order.clientAddress : order.freelancerAddress;
    
    await updateDoc(orderRef, {
      chatMessages: arrayUnion({
        id: crypto.randomUUID(),
        senderAddress,
        text,
        timestamp: new Date().toISOString()
      })
    });

    await createNotification({
      recipientId: recipientAddress,
      senderId: senderAddress,
      senderName: 'New Message',
      title: 'New Chat Message',
      message: text.length > 50 ? `${text.slice(0, 50)}...` : text,
      type: 'chat',
      orderId: orderId,
    });
  }
}

/** NOTIFICATIONS */

export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
  const id = crypto.randomUUID();
  const payload: Notification = {
    ...notification,
    id,
    createdAt: new Date().toISOString(),
    read: false,
  };
  await setDoc(doc(db, 'notifications', id), payload);
}

export function subscribeToNotifications(recipientId: string, callback: (notifications: Notification[]) => void) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', recipientId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, async (snap) => {
    const notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Notification);
    callback(notifications);

    if (notifications.length > 21) {
      const toDelete = notifications.slice(21);
      const batch = writeBatch(db);
      toDelete.forEach((n) => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      try {
        await batch.commit();
      } catch (err) {
        console.error('Failed to auto-prune notifications:', err);
      }
    }
  });
}

export async function markNotificationAsRead(notificationId: string) {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsAsRead(recipientId: string) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', recipientId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  }
}

export async function deleteNotification(notificationId: string) {
  await deleteDoc(doc(db, 'notifications', notificationId));
}
