import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CustomerOrder, AdminNotification, AdminSettings, AdminCredentials, ExpenseItem, InitialCapitalItem } from '../types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID if specified
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const ORDERS_COLLECTION = 'orders';
const NOTIFICATIONS_COLLECTION = 'notifications';
const SETTINGS_COLLECTION = 'settings';
const EXPENSES_COLLECTION = 'expenses';
const CAPITAL_COLLECTION = 'capital';
const SETTINGS_DOC_ID = 'store_config';
const ADMIN_CREDENTIALS_DOC_ID = 'admin_credentials';

/**
 * Real-time listener for orders across all devices.
 * Automatically synchronizes between Android phones, laptops, and tablets.
 */
export function subscribeToOrders(
  onOrdersUpdated: (orders: CustomerOrder[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders: CustomerOrder[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CustomerOrder;
          orders.push({
            ...data,
            id: docSnap.id,
            paymentStatus: data.paymentStatus || 'belum_bayar'
          });
        });

        // Sort descending by creation date (newest first)
        orders.sort((a, b) => {
          const tA = new Date(a.createdAt).getTime() || 0;
          const tB = new Date(b.createdAt).getTime() || 0;
          return tB - tA;
        });

        onOrdersUpdated(orders);
      },
      (error) => {
        console.error('Error listening to orders in Firestore:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to set up orders subscription:', err);
    return () => {};
  }
}

/**
 * Recursively remove any undefined keys so Firestore never throws 'Unsupported field value: undefined'
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Save new order to Cloud Firestore (accessible instantly on all devices)
 */
export async function saveOrderToCloud(order: CustomerOrder): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    const cleaned = cleanFirestoreData(order);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    console.error('Failed to save order to cloud:', error);
    throw error;
  }
}

/**
 * Update order status or fields in Cloud Firestore
 */
export async function updateOrderInCloud(orderId: string, updates: Partial<CustomerOrder>): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const cleaned = cleanFirestoreData(updates);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    console.error('Failed to update order in cloud:', error);
    throw error;
  }
}

/**
 * Delete order from Cloud Firestore
 */
export async function deleteOrderFromCloud(orderId: string): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete order from cloud:', error);
    throw error;
  }
}

/**
 * Real-time listener for admin notifications
 */
export function subscribeToNotifications(
  onNotifsUpdated: (notifs: AdminNotification[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const notifsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const unsubscribe = onSnapshot(
      notifsRef,
      (snapshot) => {
        const notifs: AdminNotification[] = [];
        snapshot.forEach((docSnap) => {
          notifs.push({
            ...(docSnap.data() as AdminNotification),
            id: docSnap.id
          });
        });

        // Filter to keep only unread notifications (read notifications are discarded)
        const unreadNotifs = notifs.filter((n) => !n.isRead);

        // Sort descending by creation date
        unreadNotifs.sort((a, b) => {
          const tA = new Date(a.createdAt).getTime() || 0;
          const tB = new Date(b.createdAt).getTime() || 0;
          return tB - tA;
        });

        // Automatically clean up any existing read notifications from Firestore
        const readIds = notifs.filter((n) => n.isRead).map((n) => n.id);
        if (readIds.length > 0) {
          deleteNotificationsFromCloud(readIds).catch(() => {});
        }

        onNotifsUpdated(unreadNotifs);
      },
      (error) => {
        console.error('Error listening to notifications in Firestore:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to set up notifications subscription:', err);
    return () => {};
  }
}

/**
 * Delete single notification from Cloud Firestore
 */
export async function deleteNotificationFromCloud(notifId: string): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete notification from cloud:', error);
  }
}

/**
 * Delete multiple notifications from Cloud Firestore
 */
export async function deleteNotificationsFromCloud(notifIds: string[]): Promise<void> {
  if (!notifIds || notifIds.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const id of notifIds) {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
      batch.delete(docRef);
    }
    await batch.commit();
  } catch (error) {
    console.error('Failed to delete notifications from cloud:', error);
  }
}

/**
 * Save notification to Cloud Firestore
 */
export async function saveNotificationToCloud(notif: AdminNotification): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notif.id);
    await setDoc(docRef, notif, { merge: true });
  } catch (error) {
    console.error('Failed to save notification to cloud:', error);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationReadInCloud(notifId: string): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);
    await setDoc(docRef, { isRead: true }, { merge: true });
  } catch (error) {
    console.error('Failed to mark notification read in cloud:', error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsReadInCloud(notifIds: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const id of notifIds) {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
      batch.set(docRef, { isRead: true }, { merge: true });
    }
    await batch.commit();
  } catch (error) {
    console.error('Failed to mark all notifications read in cloud:', error);
  }
}

/**
 * Real-time listener for store settings
 */
export function subscribeToSettings(
  onSettingsUpdated: (settings: AdminSettings) => void
): () => void {
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const unsubscribe = onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists()) {
        onSettingsUpdated(snap.data() as AdminSettings);
      }
    });
    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to settings:', err);
    return () => {};
  }
}

/**
 * Save store settings to cloud
 */
export async function saveSettingsToCloud(settings: AdminSettings): Promise<void> {
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(settingsDocRef, settings, { merge: true });
  } catch (error) {
    console.error('Failed to save settings to cloud:', error);
  }
}

/**
 * Real-time listener for admin credentials (username & password) across all devices
 */
export function subscribeToAdminCredentials(
  onCredentialsUpdated: (credentials: AdminCredentials) => void
): () => void {
  try {
    const credsDocRef = doc(db, SETTINGS_COLLECTION, ADMIN_CREDENTIALS_DOC_ID);
    const unsubscribe = onSnapshot(credsDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AdminCredentials;
        if (data && data.username && data.password) {
          onCredentialsUpdated(data);
        }
      }
    });
    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to admin credentials:', err);
    return () => {};
  }
}

/**
 * Save updated admin credentials (username & password) to Cloud Firestore
 */
export async function saveAdminCredentialsToCloud(credentials: AdminCredentials): Promise<void> {
  try {
    const credsDocRef = doc(db, SETTINGS_COLLECTION, ADMIN_CREDENTIALS_DOC_ID);
    await setDoc(credsDocRef, credentials, { merge: true });
  } catch (error) {
    console.error('Failed to save admin credentials to cloud:', error);
    throw error;
  }
}

/**
 * Seed initial sample orders to Cloud Firestore if collection is empty
 */
export async function seedInitialCloudDataIfEmpty(initialOrders: CustomerOrder[], initialSettings: AdminSettings): Promise<void> {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const snap = await getDocs(ordersRef);
    if (snap.empty && initialOrders.length > 0) {
      const batch = writeBatch(db);
      for (const order of initialOrders) {
        const ref = doc(db, ORDERS_COLLECTION, order.id);
        batch.set(ref, cleanFirestoreData(order));
      }
      // Also seed default settings
      const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      batch.set(settingsRef, initialSettings);
      await batch.commit();
      console.log('Seeded initial data to Firestore successfully.');
    }
  } catch (err) {
    console.warn('Initial cloud seed check:', err);
  }
}

/**
 * Real-time listener for expenses across all devices
 */
export function subscribeToExpenses(
  onExpensesUpdated: (expenses: ExpenseItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const expensesRef = collection(db, EXPENSES_COLLECTION);
    const q = query(expensesRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const expenses: ExpenseItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as ExpenseItem;
          expenses.push({
            ...data,
            id: docSnap.id
          });
        });

        // Sort descending by date (newest first)
        expenses.sort((a, b) => {
          const tA = new Date(a.date).getTime() || 0;
          const tB = new Date(b.date).getTime() || 0;
          return tB - tA;
        });

        onExpensesUpdated(expenses);
      },
      (error) => {
        console.error('Error listening to expenses in Firestore:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to set up expenses subscription:', err);
    return () => {};
  }
}

/**
 * Save or update an expense item in Cloud Firestore
 */
export async function saveExpenseToCloud(expense: ExpenseItem): Promise<void> {
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, expense.id);
    const cleaned = cleanFirestoreData(expense);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    console.error('Failed to save expense to cloud:', error);
    throw error;
  }
}

/**
 * Delete an expense item from Cloud Firestore
 */
export async function deleteExpenseFromCloud(expenseId: string): Promise<void> {
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, expenseId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete expense from cloud:', error);
    throw error;
  }
}

/**
 * Seed initial sample expenses to Cloud Firestore if collection is empty
 */
export async function seedInitialExpensesIfEmpty(initialExpenses: ExpenseItem[]): Promise<void> {
  try {
    const expensesRef = collection(db, EXPENSES_COLLECTION);
    const snap = await getDocs(expensesRef);
    if (snap.empty && initialExpenses.length > 0) {
      const batch = writeBatch(db);
      for (const expense of initialExpenses) {
        const ref = doc(db, EXPENSES_COLLECTION, expense.id);
        batch.set(ref, cleanFirestoreData(expense));
      }
      await batch.commit();
      console.log('Seeded initial expenses to Firestore successfully.');
    }
  } catch (err) {
    console.warn('Initial expenses seed check:', err);
  }
}

/**
 * Real-time listener for Initial Capital items in Firestore
 */
export function subscribeToCapital(
  onCapitalUpdated: (capitals: InitialCapitalItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const capitalRef = collection(db, CAPITAL_COLLECTION);
    const q = query(capitalRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const capitals: InitialCapitalItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as InitialCapitalItem;
          capitals.push({
            ...data,
            id: docSnap.id
          });
        });

        // Sort descending by date (newest first)
        capitals.sort((a, b) => {
          const tA = new Date(a.date).getTime() || 0;
          const tB = new Date(b.date).getTime() || 0;
          return tB - tA;
        });

        onCapitalUpdated(capitals);
      },
      (error) => {
        console.error('Error listening to capital in Firestore:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to set up capital subscription:', err);
    return () => {};
  }
}

/**
 * Save or update an initial capital item in Cloud Firestore
 */
export async function saveCapitalToCloud(capital: InitialCapitalItem): Promise<void> {
  try {
    const docRef = doc(db, CAPITAL_COLLECTION, capital.id);
    const cleaned = cleanFirestoreData(capital);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    console.error('Failed to save capital to cloud:', error);
    throw error;
  }
}

/**
 * Delete an initial capital item from Cloud Firestore
 */
export async function deleteCapitalFromCloud(capitalId: string): Promise<void> {
  try {
    const docRef = doc(db, CAPITAL_COLLECTION, capitalId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete capital from cloud:', error);
    throw error;
  }
}

/**
 * Seed initial sample capital items to Cloud Firestore if collection is empty
 */
export async function seedInitialCapitalIfEmpty(initialCapitals: InitialCapitalItem[]): Promise<void> {
  try {
    const capitalRef = collection(db, CAPITAL_COLLECTION);
    const snap = await getDocs(capitalRef);
    if (snap.empty && initialCapitals.length > 0) {
      const batch = writeBatch(db);
      for (const cap of initialCapitals) {
        const ref = doc(db, CAPITAL_COLLECTION, cap.id);
        batch.set(ref, cleanFirestoreData(cap));
      }
      await batch.commit();
      console.log('Seeded initial capital to Firestore successfully.');
    }
  } catch (err) {
    console.warn('Initial capital seed check:', err);
  }
}



