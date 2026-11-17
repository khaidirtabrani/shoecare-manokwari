import {
  CustomerOrder,
  AdminNotification,
  AdminSettings,
  AdminCredentials,
  ExpenseItem,
  InitialCapitalItem
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api.php').replace(/\/$/, '');
const POLL_INTERVAL_MS = 4000;

async function apiGet<T>(action: string): Promise<T | null> {
  const res = await fetch(`${API_BASE_URL}?action=${encodeURIComponent(action)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on ${action}`);
  }
  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.error || `API error on ${action}`);
  }
  return (json.data ?? null) as T | null;
}

async function apiPost<T = void>(action: string, payload: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(`${API_BASE_URL}?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on ${action}`);
  }
  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.error || `API error on ${action}`);
  }
  return (json.data ?? null) as T | null;
}

function createPollingSubscription<T>(
  fetcher: () => Promise<T | null>,
  onData: (data: T) => void,
  onError?: (err: Error) => void
): () => void {
  let active = true;

  const run = async () => {
    if (!active) return;
    try {
      const data = await fetcher();
      if (active && data !== null) {
        onData(data);
      }
    } catch (err) {
      if (active && onError && err instanceof Error) {
        onError(err);
      }
    }
  };

  run();
  const timer = window.setInterval(run, POLL_INTERVAL_MS);

  return () => {
    active = false;
    window.clearInterval(timer);
  };
}

export function subscribeToOrders(
  onOrdersUpdated: (orders: CustomerOrder[]) => void,
  onError?: (err: Error) => void
): () => void {
  return createPollingSubscription<CustomerOrder[]>(
    async () => {
      const data = await apiGet<CustomerOrder[]>('get_orders');
      if (!data) return [];
      return data
        .map((o) => ({
          ...o,
          paymentStatus: o.paymentStatus || 'belum_bayar'
        }))
        .sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0));
    },
    onOrdersUpdated,
    onError
  );
}

export async function saveOrderToCloud(order: CustomerOrder): Promise<void> {
  await apiPost('save_order', { order });
}

export async function updateOrderInCloud(orderId: string, updates: Partial<CustomerOrder>): Promise<void> {
  await apiPost('update_order', { orderId, updates });
}

export async function deleteOrderFromCloud(orderId: string): Promise<void> {
  await apiPost('delete_order', { orderId });
}

export function subscribeToNotifications(
  onNotifsUpdated: (notifs: AdminNotification[]) => void,
  onError?: (err: Error) => void
): () => void {
  return createPollingSubscription<AdminNotification[]>(
    async () => {
      const data = await apiGet<AdminNotification[]>('get_notifications');
      if (!data) return [];
      return data
        .filter((n) => !n.isRead)
        .sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0));
    },
    onNotifsUpdated,
    onError
  );
}

export async function deleteNotificationFromCloud(notifId: string): Promise<void> {
  await apiPost('delete_notification', { notifId });
}

export async function deleteNotificationsFromCloud(notifIds: string[]): Promise<void> {
  if (!notifIds || notifIds.length === 0) return;
  await apiPost('delete_notifications', { notifIds });
}

export async function saveNotificationToCloud(notif: AdminNotification): Promise<void> {
  await apiPost('save_notification', { notification: notif });
}

export function subscribeToSettings(
  onSettingsUpdated: (settings: AdminSettings) => void
): () => void {
  return createPollingSubscription<AdminSettings>(
    () => apiGet<AdminSettings>('get_settings'),
    onSettingsUpdated
  );
}

export async function saveSettingsToCloud(settings: AdminSettings): Promise<void> {
  await apiPost('save_settings', { settings });
}

export function subscribeToAdminCredentials(
  onCredentialsUpdated: (credentials: AdminCredentials) => void
): () => void {
  return createPollingSubscription<AdminCredentials>(
    async () => {
      const creds = await apiGet<AdminCredentials>('get_credentials');
      if (creds && creds.username && creds.password) {
        return creds;
      }
      return null;
    },
    onCredentialsUpdated
  );
}

export async function saveAdminCredentialsToCloud(credentials: AdminCredentials): Promise<void> {
  await apiPost('save_credentials', { credentials });
}

export async function seedInitialCloudDataIfEmpty(
  initialOrders: CustomerOrder[],
  initialSettings: AdminSettings
): Promise<void> {
  try {
    await apiPost('seed_orders', {
      orders: initialOrders,
      settings: initialSettings
    });
  } catch (err) {
    console.warn('MySQL initial orders seed check:', err);
  }
}

export function subscribeToExpenses(
  onExpensesUpdated: (expenses: ExpenseItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  return createPollingSubscription<ExpenseItem[]>(
    async () => {
      const data = await apiGet<ExpenseItem[]>('get_expenses');
      if (!data) return [];
      return data.sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
    },
    onExpensesUpdated,
    onError
  );
}

export async function saveExpenseToCloud(expense: ExpenseItem): Promise<void> {
  await apiPost('save_expense', { expense });
}

export async function deleteExpenseFromCloud(expenseId: string): Promise<void> {
  await apiPost('delete_expense', { expenseId });
}

export async function seedInitialExpensesIfEmpty(initialExpenses: ExpenseItem[]): Promise<void> {
  try {
    await apiPost('seed_expenses', { expenses: initialExpenses });
  } catch (err) {
    console.warn('MySQL initial expenses seed check:', err);
  }
}

export function subscribeToCapital(
  onCapitalUpdated: (capitals: InitialCapitalItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  return createPollingSubscription<InitialCapitalItem[]>(
    async () => {
      const data = await apiGet<InitialCapitalItem[]>('get_capital');
      if (!data) return [];
      return data.sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
    },
    onCapitalUpdated,
    onError
  );
}

export async function saveCapitalToCloud(capital: InitialCapitalItem): Promise<void> {
  await apiPost('save_capital', { capital });
}

export async function deleteCapitalFromCloud(capitalId: string): Promise<void> {
  await apiPost('delete_capital', { capitalId });
}

export async function seedInitialCapitalIfEmpty(initialCapitals: InitialCapitalItem[]): Promise<void> {
  try {
    await apiPost('seed_capital', { capitals: initialCapitals });
  } catch (err) {
    console.warn('MySQL initial capital seed check:', err);
  }
}
