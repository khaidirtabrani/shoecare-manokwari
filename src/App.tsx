/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomerOrder, AdminNotification, AdminSettings, ServiceTier, OrderStatus, AdminUser, AdminCredentials, ExpenseItem, InitialCapitalItem } from './types';
import { 
  getInitialOrders, 
  saveOrders, 
  getInitialNotifications, 
  saveNotifications, 
  getAdminSettings, 
  saveAdminSettings,
  getAdminAuthState,
  saveAdminAuthState,
  clearAdminAuthState,
  getAdminCredentials,
  saveAdminCredentials,
  getInitialExpenses,
  saveExpenses,
  getInitialCapital,
  saveCapital
} from './utils/storage';
import { playNotificationChime } from './utils/audio';
import {
  subscribeToOrders,
  subscribeToNotifications,
  subscribeToSettings,
  subscribeToAdminCredentials,
  subscribeToExpenses,
  saveExpenseToCloud,
  deleteExpenseFromCloud,
  seedInitialExpensesIfEmpty,
  subscribeToCapital,
  saveCapitalToCloud,
  deleteCapitalFromCloud,
  seedInitialCapitalIfEmpty,
  saveOrderToCloud,
  updateOrderInCloud,
  deleteOrderFromCloud,
  saveNotificationToCloud,
  deleteNotificationFromCloud,
  deleteNotificationsFromCloud,
  saveSettingsToCloud,
  saveAdminCredentialsToCloud,
  seedInitialCloudDataIfEmpty
} from './lib/database';

import { Navbar } from './components/Navbar';
import { ServiceCatalog } from './components/ServiceCatalog';
import { OrderForm } from './components/OrderForm';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { NotificationToast } from './components/NotificationToast';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AndroidSplashScreen } from './components/AndroidSplashScreen';
import { OrderTracker } from './components/OrderTracker';
import { StudioInfo } from './components/StudioInfo';
import { CustomerBottomNav, CustomerNavTab } from './components/CustomerBottomNav';

import { Sparkles, Phone, MapPin, Heart, ShieldCheck, CalendarPlus, Search, ArrowRight, ArrowLeft } from 'lucide-react';

function getTabFromUrl(): 'services' | 'admin' {
  if (typeof window === 'undefined') return 'services';
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  if (search.includes('admin') || hash.includes('admin') || pathname.endsWith('/admin')) {
    return 'admin';
  }
  return 'services';
}

function getCustomerTabFromUrl(): CustomerNavTab {
  if (typeof window === 'undefined') return 'services';
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  if (hash.includes('order') || search.includes('order')) return 'order';
  if (hash.includes('track') || search.includes('track')) return 'tracker';
  if (hash.includes('info') || search.includes('info')) return 'info';
  return 'services';
}

export default function App() {
  const [activeTab, setActiveTabState] = useState<'services' | 'admin'>(() => getTabFromUrl());
  const [customerTab, setCustomerTab] = useState<CustomerNavTab>(() => getCustomerTabFromUrl());
  const [initialTrackOrderId, setInitialTrackOrderId] = useState<string>('');

  const handleTabChange = (tab: 'services' | 'admin') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      if (tab === 'admin') {
        const newUrl = `${window.location.pathname}?page=admin`;
        window.history.pushState({ tab: 'admin' }, '', newUrl);
      } else {
        window.history.pushState({ tab: 'services' }, '', window.location.pathname);
      }
    }
  };

  const handleCustomerTabChange = (tab: CustomerNavTab) => {
    setCustomerTab(tab);
    if (typeof window !== 'undefined' && activeTab === 'services') {
      const hash = tab === 'services' ? '' : `#${tab}`;
      window.history.replaceState({ customerTab: tab }, '', `${window.location.pathname}${hash}`);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromUrl());
      setCustomerTab(getCustomerTabFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [orders, setOrders] = useState<CustomerOrder[]>(() => getInitialOrders());
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => getInitialExpenses());
  const [capitals, setCapitals] = useState<InitialCapitalItem[]>(() => getInitialCapital());
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => getInitialNotifications());
  const [settings, setSettings] = useState<AdminSettings>(() => getAdminSettings());
  const [adminAuth, setAdminAuth] = useState<{ isAuthenticated: boolean; user: AdminUser | null }>(() => getAdminAuthState());
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(() => getAdminCredentials());

  const [selectedServiceId, setSelectedServiceId] = useState<ServiceTier>('reguler');
  
  // Modals & Toasts
  const [successModalOrder, setSuccessModalOrder] = useState<CustomerOrder | null>(null);
  const [activeToastNotif, setActiveToastNotif] = useState<AdminNotification | null>(null);

  // Sync state to storage (as offline backup)
  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    saveCapital(capitals);
  }, [capitals]);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    saveAdminSettings(settings);
  }, [settings]);

  // Real-time Cloud Synchronization (Firebase Firestore) across all devices
  const isInitialLoadRef = useRef(true);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const adminAuthRef = useRef(adminAuth);
  adminAuthRef.current = adminAuth;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    // Populate known IDs from local cache
    const initialOrders = getInitialOrders();
    initialOrders.forEach(o => knownOrderIdsRef.current.add(o.id));

    // Seed sample data to cloud if Firestore is empty
    seedInitialCloudDataIfEmpty(initialOrders, settings);
    seedInitialExpensesIfEmpty(getInitialExpenses());
    seedInitialCapitalIfEmpty(getInitialCapital());

    // Subscribe to real-time Orders across all devices
    const unsubOrders = subscribeToOrders((cloudOrders) => {
      if (cloudOrders && cloudOrders.length > 0) {
        if (!isInitialLoadRef.current) {
          const newlyAdded = cloudOrders.filter(o => !knownOrderIdsRef.current.has(o.id));
          if (newlyAdded.length > 0) {
            newlyAdded.forEach(o => knownOrderIdsRef.current.add(o.id));
            if (settings.autoSoundEnabled && activeTabRef.current === 'admin' && adminAuthRef.current.isAuthenticated) {
              playNotificationChime(settingsRef.current.alarmSound || 'melodi');
            }
          }
        } else {
          cloudOrders.forEach(o => knownOrderIdsRef.current.add(o.id));
        }

        setOrders(cloudOrders);
      }
    });

    // Subscribe to real-time Expenses
    const unsubExpenses = subscribeToExpenses((cloudExpenses) => {
      if (cloudExpenses && cloudExpenses.length > 0) {
        setExpenses(cloudExpenses);
      }
    });

    // Subscribe to real-time Capital
    const unsubCapital = subscribeToCapital((cloudCapitals) => {
      if (cloudCapitals && cloudCapitals.length > 0) {
        setCapitals(cloudCapitals);
      }
    });

    // Subscribe to real-time Notifications
    const unsubNotifs = subscribeToNotifications((cloudNotifs) => {
      if (cloudNotifs && cloudNotifs.length > 0) {
        setNotifications(cloudNotifs);
        if (!isInitialLoadRef.current) {
          const unreadNew = cloudNotifs.find(n => !n.isRead);
          if (unreadNew && activeTabRef.current === 'admin' && adminAuthRef.current.isAuthenticated) {
            setActiveToastNotif(unreadNew);
          }
        }
      }
    });

    // Subscribe to real-time Settings
    const unsubSettings = subscribeToSettings((cloudSettings) => {
      if (cloudSettings) {
        setSettings(cloudSettings);
      }
    });

    // Subscribe to real-time Admin Credentials
    const unsubCreds = subscribeToAdminCredentials((cloudCreds) => {
      if (cloudCreds && cloudCreds.username && cloudCreds.password) {
        setAdminCredentials(cloudCreds);
        saveAdminCredentials(cloudCreds);
      }
    });

    isInitialLoadRef.current = false;

    return () => {
      unsubOrders();
      unsubExpenses();
      unsubCapital();
      unsubNotifs();
      unsubSettings();
      unsubCreds();
    };
  }, []);

  // Handle new order created by customer
  const handleOrderCreated = async (newOrder: CustomerOrder) => {
    knownOrderIdsRef.current.add(newOrder.id);

    // 1. Prepend order in local state
    const updatedOrders = [newOrder, ...orders.filter(o => o.id !== newOrder.id)];
    setOrders(updatedOrders);

    // 2. Automatically dispatch notification to admin
    const newNotif: AdminNotification = {
      id: `NOTIF-${Date.now()}`,
      orderId: newOrder.id,
      customerName: newOrder.customerName,
      serviceName: `${newOrder.serviceName} (${newOrder.pairCount} Pasang)`,
      totalPrice: newOrder.totalPrice,
      createdAt: new Date().toISOString(),
      isRead: false,
      message: `Pesanan baru dari ${newOrder.customerName} (${newOrder.pairCount} Pasang)`
    };

    const updatedNotifs = [newNotif, ...notifications.filter(n => n.id !== newNotif.id)];
    setNotifications(updatedNotifs);

    // Note: Do not show admin toast or chime to the customer who just submitted the order

    // 3. Open Success Modal for customer
    setSuccessModalOrder(newOrder);

    // 4. Push to Firebase Cloud Firestore for instant cross-device sync
    try {
      await saveOrderToCloud(newOrder);
      await saveNotificationToCloud(newNotif);
    } catch (err) {
      console.warn('Failed to sync new order to Firebase Firestore:', err);
    }
  };

  // Admin status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus, customNote?: string) => {
    const defaultNotes: Record<OrderStatus, string> = {
      menunggu_konfirmasi: 'Pesanan menunggu verifikasi',
      dijemput: 'Sepatu telah dijemput kurir / diterima di outlet',
      dalam_proses: 'Sedang dalam proses pencucian & deep clean',
      siap_ambil: 'Pencucian selesai! Sepatu siap diambil atau dikirim',
      selesai: 'Sepatu telah diserahterimakan kepada pelanggan. Terima kasih!',
      dibatalkan: 'Pesanan dibatalkan'
    };

    const newHistoryEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: customNote || defaultNotes[newStatus] || `Status diubah menjadi ${newStatus}`
    };

    let updatedHistory = [newHistoryEntry];

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        updatedHistory = [...(order.statusHistory || []), newHistoryEntry];
        return {
          ...order,
          status: newStatus,
          statusHistory: updatedHistory
        };
      }
      return order;
    }));

    try {
      await updateOrderInCloud(orderId, {
        status: newStatus,
        statusHistory: updatedHistory
      });
    } catch (err) {
      console.warn('Failed to sync status update to Firebase:', err);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: CustomerOrder['paymentStatus']) => {
    let targetOrder: CustomerOrder | undefined;
    setOrders(prev => {
      const next = prev.map(o => {
        if (o.id === orderId) {
          targetOrder = { ...o, paymentStatus: status };
          return targetOrder;
        }
        return o;
      });
      saveOrders(next);
      return next;
    });

    try {
      if (targetOrder) {
        await saveOrderToCloud(targetOrder);
      } else {
        await updateOrderInCloud(orderId, { paymentStatus: status });
      }
    } catch (err) {
      console.warn('Failed to sync payment status to Firebase:', err);
    }
  };

  // Admin note update
  const handleUpdateAdminNote = async (orderId: string, note: string) => {
    let targetOrder: CustomerOrder | undefined;
    setOrders(prev => {
      const next = prev.map(o => {
        if (o.id === orderId) {
          targetOrder = { ...o, adminNotes: note };
          return targetOrder;
        }
        return o;
      });
      saveOrders(next);
      return next;
    });

    try {
      if (targetOrder) {
        await saveOrderToCloud(targetOrder);
      } else {
        await updateOrderInCloud(orderId, { adminNotes: note });
      }
    } catch (err) {
      console.warn('Failed to sync admin note to Firebase:', err);
    }
  };

  // Mark all notifications as read and clear them from history
  const handleMarkAllNotificationsRead = async () => {
    const idsToDelete = notifications.map(n => n.id);
    setNotifications([]);
    setOrders(prev => prev.map(o => ({ ...o, isReadByAdmin: true })));
    if (idsToDelete.length > 0) {
      try {
        await deleteNotificationsFromCloud(idsToDelete);
      } catch (err) {
        console.warn('Failed to sync mark all notifications read:', err);
      }
    }
  };

  // Dismiss / Mark individual notification as read (immediately removes from list)
  const handleDismissNotification = async (notifId: string) => {
    const target = notifications.find(n => n.id === notifId);
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    if (target?.orderId) {
      setOrders(prev => prev.map(o => o.id === target.orderId ? { ...o, isReadByAdmin: true } : o));
    }
    try {
      await deleteNotificationFromCloud(notifId);
    } catch (err) {
      console.warn('Failed to delete notification from cloud:', err);
    }
  };

  // Dismiss all notifications for a specific order
  const handleDismissNotificationsForOrder = async (orderId: string) => {
    const matching = notifications.filter(n => n.orderId === orderId);
    if (matching.length === 0) return;
    const ids = matching.map(n => n.id);
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, isReadByAdmin: true } : o));
    try {
      await deleteNotificationsFromCloud(ids);
    } catch (err) {
      console.warn('Failed to delete notifications for order from cloud:', err);
    }
  };

  // Admin settings save
  const handleSaveSettings = async (newSettings: AdminSettings) => {
    setSettings(newSettings);
    try {
      await saveSettingsToCloud(newSettings);
    } catch (err) {
      console.warn('Failed to sync settings to Firebase:', err);
    }
  };

  // Admin delete order
  const handleDeleteOrder = async (orderId: string) => {
    knownOrderIdsRef.current.delete(orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setNotifications(prev => prev.filter(n => n.orderId !== orderId));
    try {
      await deleteOrderFromCloud(orderId);
    } catch (err) {
      console.warn('Failed to delete order from cloud:', err);
    }
  };

  // Admin delete customer (removes customer profile and all their orders)
  const handleDeleteCustomer = async (customerPhone: string) => {
    const ordersToDelete = orders.filter(o => o.customerPhone === customerPhone);
    const orderIds = ordersToDelete.map(o => o.id);
    orderIds.forEach(id => knownOrderIdsRef.current.delete(id));
    setOrders(prev => {
      const updated = prev.filter(o => o.customerPhone !== customerPhone);
      saveOrders(updated);
      return updated;
    });
    setNotifications(prev => {
      const updated = prev.filter(n => !n.orderId || !orderIds.includes(n.orderId));
      saveNotifications(updated);
      return updated;
    });
    try {
      for (const id of orderIds) {
        await deleteOrderFromCloud(id);
      }
    } catch (err) {
      console.warn('Failed to delete customer orders from cloud:', err);
    }
  };

  // Admin edit customer and order data
  const handleEditCustomer = async (orderId: string, updatedFields: Partial<CustomerOrder>) => {
    let targetOrder: CustomerOrder | undefined;
    setOrders(prev => {
      const next = prev.map(o => {
        if (o.id === orderId) {
          targetOrder = { ...o, ...updatedFields };
          return targetOrder;
        }
        return o;
      });
      saveOrders(next);
      return next;
    });

    try {
      if (targetOrder) {
        await saveOrderToCloud(targetOrder);
      } else {
        await updateOrderInCloud(orderId, updatedFields);
      }
    } catch (err) {
      console.warn('Failed to update customer order in cloud:', err);
    }
  };

  // Expense handlers
  const handleSaveExpense = async (expense: ExpenseItem) => {
    setExpenses(prev => {
      const exists = prev.some(e => e.id === expense.id);
      const next = exists
        ? prev.map(e => e.id === expense.id ? expense : e)
        : [expense, ...prev];
      saveExpenses(next);
      return next;
    });

    try {
      await saveExpenseToCloud(expense);
    } catch (err) {
      console.warn('Failed to save expense to cloud:', err);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== expenseId);
      saveExpenses(next);
      return next;
    });

    try {
      await deleteExpenseFromCloud(expenseId);
    } catch (err) {
      console.warn('Failed to delete expense from cloud:', err);
    }
  };

  // Capital handlers
  const handleSaveCapital = async (capital: InitialCapitalItem) => {
    setCapitals(prev => {
      const exists = prev.some(c => c.id === capital.id);
      const next = exists
        ? prev.map(c => c.id === capital.id ? capital : c)
        : [capital, ...prev];
      saveCapital(next);
      return next;
    });

    try {
      await saveCapitalToCloud(capital);
    } catch (err) {
      console.warn('Failed to save capital to cloud:', err);
    }
  };

  const handleDeleteCapital = async (capitalId: string) => {
    setCapitals(prev => {
      const next = prev.filter(c => c.id !== capitalId);
      saveCapital(next);
      return next;
    });

    try {
      await deleteCapitalFromCloud(capitalId);
    } catch (err) {
      console.warn('Failed to delete capital from cloud:', err);
    }
  };

  // Select service from catalog - switches tab directly to booking form
  const handleSelectServiceFromCatalog = (serviceId: ServiceTier) => {
    setSelectedServiceId(serviceId);
    handleCustomerTabChange('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Track order from success modal or action
  const handleTrackNewOrder = (orderId: string) => {
    setSuccessModalOrder(null);
    setInitialTrackOrderId(orderId);
    handleCustomerTabChange('tracker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin Authentication handlers
  const handleAdminLoginSuccess = (user: AdminUser, remember: boolean) => {
    const newAuth = { isAuthenticated: true, user };
    setAdminAuth(newAuth);
    if (remember) {
      saveAdminAuthState(newAuth);
    }
  };

  const handleAdminLogout = () => {
    setAdminAuth({ isAuthenticated: false, user: null });
    clearAdminAuthState();
  };

  // Admin Credentials management (Username & Password)
  const handleSaveCredentials = async (newCreds: AdminCredentials) => {
    setAdminCredentials(newCreds);
    saveAdminCredentials(newCreds);

    // If currently logged in, sync the logged in user state
    if (adminAuth.user) {
      const updatedUser: AdminUser = {
        ...adminAuth.user,
        username: newCreds.username,
        name: newCreds.username === 'admin' ? 'Administrator Shoecare Manokwari' : `Admin (${newCreds.username})`
      };
      const updatedAuth = { isAuthenticated: true, user: updatedUser };
      setAdminAuth(updatedAuth);
      saveAdminAuthState(updatedAuth);
    }

    try {
      await saveAdminCredentialsToCloud(newCreds);
    } catch (err) {
      console.warn('Failed to save admin credentials to cloud:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Android Entry Splash Screen with Official Logo */}
      <AndroidSplashScreen />

      {/* Top Navigation - displayed on customer portal and login */}
      {!(activeTab === 'admin' && adminAuth.isAuthenticated) && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            handleTabChange(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          customerTab={customerTab}
          setCustomerTab={handleCustomerTabChange}
          unreadCount={unreadCount}
          isAdminAuthenticated={adminAuth.isAuthenticated}
        />
      )}

      {/* Main View Container */}
      {activeTab === 'admin' && adminAuth.isAuthenticated ? (
        <div className="flex-1 w-full bg-[#0c0e12] min-h-screen">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AdminDashboard
              orders={orders}
              expenses={expenses}
              notifications={notifications}
              settings={settings}
              adminCredentials={adminCredentials}
              onSaveCredentials={handleSaveCredentials}
              adminUser={adminAuth.user}
              onLogout={handleAdminLogout}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
              onUpdateAdminNote={handleUpdateAdminNote}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
              onDismissNotification={handleDismissNotification}
              onDismissNotificationsForOrder={handleDismissNotificationsForOrder}
              onSaveSettings={handleSaveSettings}
              onDeleteOrder={handleDeleteOrder}
              onEditCustomer={handleEditCustomer}
              onSaveExpense={handleSaveExpense}
              onDeleteExpense={handleDeleteExpense}
              capitals={capitals}
              onSaveCapital={handleSaveCapital}
              onDeleteCapital={handleDeleteCapital}
              onDeleteCustomer={handleDeleteCustomer}
              onCreateOrder={handleOrderCreated}
              onSwitchToCustomerPortal={() => {
                handleTabChange('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </motion.div>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 sm:pb-12">
          {/* Unified Customer Portal Tabs (No more long endless scrolling!) */}
          {activeTab === 'services' && (
            <div className="space-y-10">
              {/* TAB 1: LAYANAN & HARGA (Catalog + Before/After) */}
              {customerTab === 'services' && (
                <div className="space-y-12 animate-fade-in">
                  <ServiceCatalog onSelectService={handleSelectServiceFromCatalog} settings={settings} />

                  {/* Quick Bottom CTA to Booking Form */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 border border-emerald-500/40">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Siap Merawat Sepatu Anda</span>
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                        Sudah Menemukan Layanan yang Tepat?
                      </h3>
                      <p className="text-xs text-emerald-100 max-w-xl">
                        Langsung isi formulir booking online tanpa perlu scroll panjang. Bisa antar sendiri (drop-off) ke outlet atau minta kurir kami jemput ke rumah di Manokwari.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleCustomerTabChange('order');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs sm:text-sm shadow-lg flex items-center space-x-2 transition-all cursor-pointer shrink-0 hover:scale-[1.02]"
                    >
                      <span>Isi Formulir Booking Sekarang</span>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: BOOKING ONLINE (Focused Booking Form) */}
              {customerTab === 'order' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center space-x-2">
                        <CalendarPlus className="w-5 h-5 text-emerald-600" />
                        <span>Formulir Booking Cuci & Perawatan Sepatu</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pilih jenis layanan, isi alamat penjemputan/drop-off, dan konfirmasi langsung ke admin via WhatsApp.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleCustomerTabChange('services');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200/80 transition-colors inline-flex items-center space-x-1 cursor-pointer shrink-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Lihat Daftar Harga & Paket</span>
                    </button>
                  </div>

                  <OrderForm
                    initialServiceId={selectedServiceId}
                    onOrderCreated={handleOrderCreated}
                    existingCustomers={orders.map(o => ({ name: o.customerName, phone: o.customerPhone }))}
                    allOrders={orders}
                    settings={settings}
                  />
                </div>
              )}

              {/* TAB 3: LACAK PESANAN (Customer Realtime Tracker) */}
              {customerTab === 'tracker' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center space-x-2">
                        <Search className="w-5 h-5 text-emerald-600" />
                        <span>Lacak Progres & Status Cuci Sepatu</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Masukkan Nomor Resi / ID Pesanan (misal: SP-9821) atau Nomor WhatsApp Anda untuk melihat status pengerjaan secara realtime.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleCustomerTabChange('order');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors inline-flex items-center space-x-1 cursor-pointer shrink-0"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Booking Cuci Baru</span>
                    </button>
                  </div>

                  <OrderTracker
                    orders={orders}
                    initialSearchId={initialTrackOrderId}
                    isAdminMode={false}
                  />
                </div>
              )}

              {/* TAB 4: INFO STUDIO & LOKASI */}
              {customerTab === 'info' && (
                <StudioInfo
                  settings={settings}
                  onBookingClick={() => {
                    handleCustomerTabChange('order');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'admin' && !adminAuth.isAuthenticated && (
            <AdminLogin
              credentials={adminCredentials}
              onLoginSuccess={handleAdminLoginSuccess}
              onBackToHome={() => {
                handleTabChange('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </main>
      )}

      {/* Success Modal after ordering */}
      {successModalOrder && (
        <OrderSuccessModal
          order={successModalOrder}
          adminPhone={settings.adminPhone}
          onClose={() => setSuccessModalOrder(null)}
          onTrackOrder={handleTrackNewOrder}
        />
      )}

      {/* Realtime Notification Toast (Only in Admin view for authenticated Admin) */}
      {activeTab === 'admin' && adminAuth.isAuthenticated && (
        <NotificationToast
          notification={activeToastNotif}
          onClose={() => setActiveToastNotif(null)}
          onOpenAdmin={() => {
            handleTabChange('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      <OfflineIndicator />

      {/* Mobile Bottom Navigation Bar (Active on Customer View) */}
      {!(activeTab === 'admin' && adminAuth.isAuthenticated) && (
        <CustomerBottomNav
          currentTab={customerTab}
          onTabChange={handleCustomerTabChange}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 pt-12 pb-16 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-100">
            {/* Brand column */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-md shadow-emerald-700/10 border border-slate-100">
                  <img 
                    src="/logo.jpg" 
                    alt="Logo Shoecare Manokwari" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none">Shoecare <span className="text-emerald-600">Manokwari</span></h4>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Studio cuci dan restorasi sepatu profesional di Manokwari, Papua Barat. Mengembalikan kebersihan, warna, dan aroma sepatu favorit Anda dengan teknik khusus dan cairan pembersih premium.
              </p>
            </div>

            {/* Menu Navigasi Pelanggan column */}
            <div className="space-y-2 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Menu Pelanggan</h4>
              <ul className="space-y-1.5 pt-1">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleTabChange('services');
                      handleCustomerTabChange('services');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-emerald-700 transition-colors cursor-pointer text-left"
                  >
                    🏷️ Katalog Layanan & Harga
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleTabChange('services');
                      handleCustomerTabChange('order');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-emerald-700 transition-colors cursor-pointer text-left font-bold text-emerald-800"
                  >
                    📝 Formulir Booking Online
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleTabChange('services');
                      handleCustomerTabChange('tracker');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-emerald-700 transition-colors cursor-pointer text-left"
                  >
                    🔍 Lacak Status Pesanan (Cek Resi)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleTabChange('services');
                      handleCustomerTabChange('info');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-emerald-700 transition-colors cursor-pointer text-left"
                  >
                    📍 Jam Operasional & Rute Outlet
                  </button>
                </li>
              </ul>
            </div>

            {/* Studio Info column */}
            <div className="space-y-2 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Jam Operasional & Outlet</h4>
              <p className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span>{settings.storeAddress}</span>
              </p>
              <p className="text-slate-500 pl-6">
                Senin - Minggu: <strong className="text-slate-800">09.00 - 21.00 WIT</strong>
              </p>
              <p className="text-slate-500 pl-6 text-[11px]">
                🛵 Kurir Antar-Jemput: <strong>10.00 - 20.00 WIT</strong>
              </p>
            </div>

            {/* Direct Contact column */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Layanan Konsultasi</h4>
              <p className="text-slate-500">
                Punya pertanyaan mengenai bahan sepatu Anda? Hubungi customer care kami via WhatsApp.
              </p>
              <a
                href={`https://wa.me/${settings.adminPhone}?text=Halo%20Admin%20Shoecare%20Manokwari,%20saya%20ingin%20tanya%20seputar%20cuci%20sepatu`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp: +{settings.adminPhone}</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center space-x-3">
              <p>© 2026 Shoecare Manokwari. Hak Cipta Dilindungi.</p>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  handleTabChange('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Portal Admin
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-600 font-medium">Pelayanan Bersih & Higienis</span>
              </span>
              <span>•</span>
              <span className="text-slate-600 font-medium">Pembersih Organik & Aman Sol</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
