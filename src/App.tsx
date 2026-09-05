/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CustomerOrder, AdminNotification, AdminSettings, ServiceTier, OrderStatus, AdminUser } from './types';
import { 
  getInitialOrders, 
  saveOrders, 
  getInitialNotifications, 
  saveNotifications, 
  getAdminSettings, 
  saveAdminSettings,
  getAdminAuthState,
  saveAdminAuthState,
  clearAdminAuthState
} from './utils/storage';
import { playNotificationChime } from './utils/audio';

import { Navbar } from './components/Navbar';
import { ServiceCatalog } from './components/ServiceCatalog';
import { OrderForm } from './components/OrderForm';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { NotificationToast } from './components/NotificationToast';
import { StoreLocation } from './components/StoreLocation';

import { Sparkles, Phone, MapPin, Heart, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'services' | 'admin'>('services');
  const [orders, setOrders] = useState<CustomerOrder[]>(() => getInitialOrders());
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => getInitialNotifications());
  const [settings, setSettings] = useState<AdminSettings>(() => getAdminSettings());
  const [adminAuth, setAdminAuth] = useState<{ isAuthenticated: boolean; user: AdminUser | null }>(() => getAdminAuthState());

  const [selectedServiceId, setSelectedServiceId] = useState<ServiceTier>('reguler');
  
  // Modals & Toasts
  const [successModalOrder, setSuccessModalOrder] = useState<CustomerOrder | null>(null);
  const [activeToastNotif, setActiveToastNotif] = useState<AdminNotification | null>(null);

  // Sync state to storage
  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    saveAdminSettings(settings);
  }, [settings]);

  // Handle new order created by customer
  const handleOrderCreated = (newOrder: CustomerOrder) => {
    // 1. Prepend order
    const updatedOrders = [newOrder, ...orders];
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
      message: `Pesanan baru dari ${newOrder.customerName} via ${newOrder.deliveryMethod === 'pickup' ? 'Antar-Jemput' : 'Drop-off'}`
    };

    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);

    // 3. Play audio chime if enabled
    if (settings.autoSoundEnabled) {
      playNotificationChime();
    }

    // 4. Show visual toast
    setActiveToastNotif(newNotif);

    // 5. Open Success Modal for customer
    setSuccessModalOrder(newOrder);
  };

  // Admin status update
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, customNote?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
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

        return {
          ...order,
          status: newStatus,
          statusHistory: [...(order.statusHistory || []), newHistoryEntry]
        };
      }
      return order;
    }));
  };

  const handleUpdatePaymentStatus = (orderId: string, status: CustomerOrder['paymentStatus']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: status } : o));
  };

  // Admin note update
  const handleUpdateAdminNote = (orderId: string, note: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, adminNotes: note } : o));
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setOrders(prev => prev.map(o => ({ ...o, isReadByAdmin: true })));
  };

  // Select service from catalog - smooth scrolls to form
  const handleSelectServiceFromCatalog = (serviceId: ServiceTier) => {
    setSelectedServiceId(serviceId);
    const formElement = document.getElementById('form-cuci-sepatu');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unreadCount={unreadCount}
        isAdminAuthenticated={adminAuth.isAuthenticated}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Unified Customer Tab: Daftar Cuci & Harga (Catalog + Form in 1 flow) */}
        {activeTab === 'services' && (
          <div className="space-y-16">
            <ServiceCatalog onSelectService={handleSelectServiceFromCatalog} />

            <div className="pt-8 border-t border-slate-200">
              <OrderForm
                initialServiceId={selectedServiceId}
                pickupFee={settings.pickupFee}
                onOrderCreated={handleOrderCreated}
              />
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <StoreLocation 
            storeName={settings.storeName}
            storeAddress={settings.storeAddress}
            storePhone={settings.adminPhone}
          />
        )}

        {activeTab === 'admin' && (
          !adminAuth.isAuthenticated ? (
            <AdminLogin
              onLoginSuccess={handleAdminLoginSuccess}
              onBackToHome={() => {
                setActiveTab('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <AdminDashboard
              orders={orders}
              notifications={notifications}
              settings={settings}
              adminUser={adminAuth.user}
              onLogout={handleAdminLogout}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
              onUpdateAdminNote={handleUpdateAdminNote}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
              onSaveSettings={setSettings}
            />
          )
        )}
      </main>

      {/* Success Modal after ordering */}
      {successModalOrder && (
        <OrderSuccessModal
          order={successModalOrder}
          adminPhone={settings.adminPhone}
          onClose={() => setSuccessModalOrder(null)}
        />
      )}

      {/* Realtime Notification Toast */}
      <NotificationToast
        notification={activeToastNotif}
        onClose={() => setActiveToastNotif(null)}
        onOpenAdmin={() => {
          setActiveTab('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-100">
            {/* Brand column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-md shadow-emerald-700/10 border border-slate-100">
                  <img 
                    src="/src/assets/images/shoecare_manokwari_logo_1788629081132.jpg" 
                    alt="Logo Shoecare Manokwari" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none">Shoecare <span className="text-emerald-600">Manokwari</span></h4>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-widest mt-1 block">Care Atelier</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Studio cuci dan restorasi sepatu profesional di Manokwari, Papua Barat. Mengembalikan kebersihan, warna, dan aroma sepatu favorit Anda dengan teknik khusus dan cairan pembersih premium.
              </p>
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
            </div>

            {/* Direct Contact & Guarantee column */}
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
            <p>© 2026 Shoecare Manokwari. Hak Cipta Dilindungi.</p>
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
