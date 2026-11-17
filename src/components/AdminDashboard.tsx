import React, { useState, useEffect, useMemo } from 'react';
import { 
  CustomerOrder, 
  AdminNotification, 
  AdminSettings, 
  OrderStatus, 
  AdminUser, 
  AdminCredentials, 
  AlarmSoundType, 
  ExpenseItem, 
  InitialCapitalItem
} from '../types';
import { getServices, getAddOns, DEFAULT_ADMIN_SETTINGS } from '../data/services';
import { formatRupiah, buildWhatsAppCustomerConfirmUrl } from '../utils/storage';
import { playNotificationChime, SOUND_OPTIONS } from '../utils/audio';

import { InvoiceModal } from './InvoiceModal';
import { SoundPickerModal } from './SoundPickerModal';
import { FinancialReport } from './FinancialReport';
import { CustomerDatabase } from './CustomerDatabase';
import { OrderTracker } from './OrderTracker';
import { EditCustomerModal } from './EditCustomerModal';
import { DeleteOrderModal } from './DeleteOrderModal';
import { ChangeCredentialsModal } from './ChangeCredentialsModal';
import { ExpenseManager } from './ExpenseManager';
import { CapitalManager } from './CapitalManager';
import { ShoeThumbnail } from './ShoeThumbnail';
import { AdminOrdersManifest } from './AdminOrdersManifest';
import { OrderPhotoViewerModal } from './OrderPhotoViewerModal';

import { 
  Bell, 
  CheckCheck, 
  Search, 
  FileText, 
  Clock, 
  Sparkles, 
  Settings, 
  Volume2, 
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Layers,
  LogOut,
  UserCheck,
  Calendar,
  X,
  Trash2,
  KeyRound,
  User,
  ShoppingBag,
  Coins,
  ChevronRight,
  ChevronDown,
  Menu,
  ShieldCheck,
  Droplets,
  Paintbrush,
  Footprints,
  LayoutGrid,
  PlusCircle,
  ClipboardList,
  Users,
  Tag,
  Receipt,
  BarChart3,
  Check,
  TrendingUp,
  Scale,
  Landmark,
  ArrowRight,
  Store,
  Camera,
  Eye
} from 'lucide-react';

interface AdminDashboardProps {
  orders: CustomerOrder[];
  expenses?: ExpenseItem[];
  capitals?: InitialCapitalItem[];
  notifications: AdminNotification[];
  settings: AdminSettings;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, adminNote?: string) => void;
  onUpdatePaymentStatus: (orderId: string, status: 'belum_bayar' | 'sudah_bayar') => void;
  onUpdateAdminNote: (orderId: string, note: string) => void;
  onMarkAllNotificationsRead: () => void;
  onDismissNotification?: (notifId: string) => void;
  onDismissNotificationsForOrder?: (orderId: string) => void;
  onSaveSettings: (settings: AdminSettings) => void;
  onDeleteOrder?: (orderId: string) => Promise<void> | void;
  onEditCustomer?: (orderId: string, updatedFields: Partial<CustomerOrder>) => Promise<void> | void;
  onSaveExpense?: (expense: ExpenseItem) => Promise<void> | void;
  onDeleteExpense?: (expenseId: string) => Promise<void> | void;
  onSaveCapital?: (capital: InitialCapitalItem) => Promise<void> | void;
  onDeleteCapital?: (capitalId: string) => Promise<void> | void;
  onDeleteCustomer?: (customerPhone: string, customerName: string) => Promise<void> | void;
  adminCredentials?: AdminCredentials;
  onSaveCredentials?: (credentials: AdminCredentials) => Promise<void> | void;
  adminUser?: AdminUser | null;
  onLogout?: () => void;
  onCreateOrder?: (order: CustomerOrder) => Promise<void> | void;
  onSwitchToCustomerPortal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  expenses = [],
  capitals = [],
  notifications,
  settings,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onUpdateAdminNote,
  onMarkAllNotificationsRead,
  onDismissNotification,
  onDismissNotificationsForOrder,
  onSaveSettings,
  onDeleteOrder,
  onEditCustomer,
  onSaveExpense,
  onDeleteExpense,
  onSaveCapital,
  onDeleteCapital,
  onDeleteCustomer,
  adminCredentials,
  onSaveCredentials,
  adminUser,
  onLogout,
  onCreateOrder,
  onSwitchToCustomerPortal
}) => {
  // Navigation sub-tab
  const [adminSubTab, setAdminSubTab] = useState<
    'dashboard' | 'orders' | 'customers' | 'services' | 'pricing' | 'history' | 'finance' | 'expenses' | 'capital' | 'track'
  >('dashboard');

  // Mobile sidebar toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Profile dropdown menu toggle
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Modals
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<CustomerOrder | null>(null);
  const [viewingPhotoOrder, setViewingPhotoOrder] = useState<{
    order: CustomerOrder;
    shoeIndex?: number;
  } | null>(null);
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangeCredentialsOpen, setIsChangeCredentialsOpen] = useState(false);
  const [editingCustomerOrder, setEditingCustomerOrder] = useState<CustomerOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<CustomerOrder | null>(null);
  const [confirmCancelOrder, setConfirmCancelOrder] = useState<CustomerOrder | null>(null);
  const [promptWhatsAppModal, setPromptWhatsAppModal] = useState<{ order: CustomerOrder; newStatus: OrderStatus } | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');

  const handleUpdateShoePhoto = async (orderId: string, shoeIndex: number, newPhotoUrl: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;
    const updatedShoeDetails = [...(targetOrder.shoeDetails || [])];
    if (updatedShoeDetails[shoeIndex]) {
      updatedShoeDetails[shoeIndex] = {
        ...updatedShoeDetails[shoeIndex],
        photoUrl: newPhotoUrl
      };
    } else {
      updatedShoeDetails[shoeIndex] = {
        brandModel: 'Sepatu',
        shoeType: 'Sneakers / Casual',
        color: '',
        photoUrl: newPhotoUrl
      };
    }
    if (onEditCustomer) {
      await onEditCustomer(orderId, { shoeDetails: updatedShoeDetails });
    }
    setViewingPhotoOrder(prev => prev ? {
      ...prev,
      order: {
        ...prev.order,
        shoeDetails: updatedShoeDetails
      }
    } : null);
  };

  // Settings form temporary state
  const [tempSettings, setTempSettings] = useState<AdminSettings>(settings);

  // Indonesian Live Date & Time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const indonesianDate = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayName = days[currentTime.getDay()];
    const day = currentTime.getDate();
    const monthName = months[currentTime.getMonth()];
    const year = currentTime.getFullYear();
    return `${dayName}, ${day} ${monthName} ${year}`;
  }, [currentTime]);

  const indonesianTime = useMemo(() => {
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} WIB`;
  }, [currentTime]);

  // Display only real saved orders, newest first (up to 10 most recent)
  const displayRecentOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [orders]);

  // Real-time KPI calculations strictly from saved orders
  const totalOrdersToday = useMemo(() => {
    return orders ? orders.length : 0;
  }, [orders]);

  const inProgressCount = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    return orders.filter(o => o.status === 'dalam_proses' || o.status === 'dijemput').length;
  }, [orders]);

  const completedTodayCount = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    return orders.filter(o => o.status === 'selesai' || o.status === 'siap_ambil').length;
  }, [orders]);

  const totalRevenueToday = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    return orders.reduce((acc, o) => acc + (o.status !== 'dibatalkan' ? o.totalPrice : 0), 0);
  }, [orders]);

  const handleQuickServiceClick = (serviceType: string) => {
    setAdminSubTab('services');
    playNotificationChime('dingdong');
  };

  const handleCreateOrderInternal = async (newOrder: CustomerOrder) => {
    if (onCreateOrder) {
      await onCreateOrder(newOrder);
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'dalam_proses':
      case 'dijemput':
        return (
          <span className="bg-blue-950/80 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wide">
            PROSES
          </span>
        );
      case 'menunggu_konfirmasi':
        return (
          <span className="bg-amber-950/80 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wide">
            MENUNGGU
          </span>
        );
      case 'selesai':
      case 'siap_ambil':
        return (
          <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wide">
            SELESAI
          </span>
        );
      case 'dibatalkan':
        return (
          <span className="bg-rose-950/80 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wide">
            BATAL
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-slate-100 flex flex-col font-sans select-none">
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* ========================================================= */}
        {/* LEFT SIDEBAR (Matching reference image)                    */}
        {/* ========================================================= */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0f1117] border-r border-[#1e2330] flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div>
            {/* Brand Logo & Title */}
            <div className="flex flex-col items-center text-center py-4 border-b border-[#1e2330]/80">
              {/* Circular Gold Seal Logo */}
              <div className="w-16 h-16 rounded-full border-2 border-[#e5a93c] bg-[#161a22] flex items-center justify-center shadow-lg shadow-amber-500/10 mb-2 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-amber-300/10 pointer-events-none" />
                <img 
                  src="/logo.jpg" 
                  alt="Shoecare Manokwari" 
                  className="w-12 h-12 object-contain rounded-full"
                  onError={(e) => {
                    // Fallback to stylized vector shoe if logo.jpg doesn't load
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <Footprints className="w-8 h-8 text-[#e5a93c] drop-shadow-md" />
              </div>

              <h1 className="text-base font-black tracking-widest text-[#e5a93c] uppercase">
                SHOECARE
              </h1>
              <div className="text-xs font-black tracking-[0.25em] text-[#e5a93c]">
                MANOKWARI
              </div>
              <div className="text-[8px] font-bold tracking-[0.2em] text-[#e5a93c]/80 uppercase mt-1">
                CLEAN • CARE • PREMIUM
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="mt-5 space-y-1 text-xs">
              {/* Dashboard */}
              <button
                type="button"
                onClick={() => {
                  setAdminSubTab('dashboard');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  adminSubTab === 'dashboard'
                    ? 'bg-[#e5a93c] text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a1e28]'
                }`}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </button>

              {/* Daftar Order */}
              <button
                type="button"
                onClick={() => {
                  setAdminSubTab('orders');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  adminSubTab === 'orders'
                    ? 'bg-[#e5a93c] text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a1e28]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  <span>Daftar Order</span>
                </div>
                {orders.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    adminSubTab === 'orders' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-[#1e2330] text-amber-400'
                  }`}>
                    {orders.length}
                  </span>
                )}
              </button>

              {/* Pelanggan */}
              <button
                type="button"
                onClick={() => {
                  setAdminSubTab('customers');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  adminSubTab === 'customers'
                    ? 'bg-[#e5a93c] text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a1e28]'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Pelanggan</span>
              </button>

              {/* Layanan & Harga */}
              <button
                type="button"
                onClick={() => {
                  setAdminSubTab('services');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  adminSubTab === 'services' || adminSubTab === 'pricing'
                    ? 'bg-[#e5a93c] text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a1e28]'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Layanan & Harga</span>
              </button>

              {/* Riwayat Transaksi / Kas */}
              <button
                type="button"
                onClick={() => {
                  setAdminSubTab('history');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  adminSubTab === 'history' || adminSubTab === 'capital' || adminSubTab === 'expenses'
                    ? 'bg-[#e5a93c] text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a1e28]'
                }`}
              >
                <Receipt className="w-4 h-4 shrink-0" />
                <span>Riwayat Transaksi</span>
              </button>

              {/* Laporan */}
              <button
                type="button"
                onClick={() => {
                  setAdminSubTab('finance');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  adminSubTab === 'finance'
                    ? 'bg-[#e5a93c] text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a1e28]'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Laporan</span>
              </button>

              {/* Pengaturan */}
              <button
                type="button"
                onClick={() => {
                  setTempSettings({ ...settings });
                  setIsSettingsOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1a1e28] font-bold transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Pengaturan</span>
              </button>
            </nav>
          </div>

          {/* Bottom Card (Promotional / Quality Badge as in reference image) */}
          <div className="mt-4 p-3.5 rounded-2xl bg-[#141720] border border-[#232838] relative overflow-hidden">
            <div className="relative z-10 space-y-1.5 text-[11px]">
              <div className="font-extrabold text-[#e5a93c] text-xs uppercase tracking-wide">
                SHOECARE MANOKWARI
              </div>
              <p className="text-slate-400 text-[10px] pb-1">
                Yang Profesional Manokwari
              </p>
              <div className="space-y-1 text-slate-300 font-medium text-[10px]">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[#e5a93c]">✓</span>
                  <span>Kualitas Terjamin</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[#e5a93c]">✓</span>
                  <span>Pengerjaan Teliti</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[#e5a93c]">✓</span>
                  <span>Hasil Maksimal</span>
                </div>
              </div>
            </div>

            {/* Subtle background shoe lineart */}
            <div className="absolute -bottom-3 -right-3 w-16 h-16 opacity-10 pointer-events-none text-[#e5a93c]">
              <Footprints className="w-full h-full" />
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* MAIN VIEWPORT CONTAINER                                    */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar Header */}
          <header className="sticky top-0 z-30 bg-[#0f1117]/95 backdrop-blur-md border-b border-[#1e2330] px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Left: Mobile Toggle & Page Title */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-[#1a1e28] border border-[#282f40] cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-baseline space-x-2">
                <h2 className="text-sm sm:text-base font-black tracking-wider uppercase text-white">
                  DASHBOARD
                </h2>
                <span className="text-slate-500 font-light text-xs hidden sm:inline">|</span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Sistem Cuci Sepatu
                </span>
              </div>
            </div>

            {/* Right: Date, Time & Admin Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
              {/* Date Box */}
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#141720] border border-[#232838] text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-[11px]">{indonesianDate}</span>
              </div>

              {/* Time Box */}
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#141720] border border-[#232838] text-slate-300">
                <Clock className="w-3.5 h-3.5 text-[#e5a93c]" />
                <span className="font-bold text-[11px] font-mono text-white">{indonesianTime}</span>
              </div>

              {/* Admin Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#141720] hover:bg-[#1a1e28] border border-[#232838] text-slate-200 transition-colors cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-[#e5a93c]/20 border border-[#e5a93c]/50 text-[#e5a93c] flex items-center justify-center font-bold text-[10px]">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-xs">{adminUser?.name || 'Admin'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#141720] border border-[#232838] shadow-2xl py-2 z-50 text-xs animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-[#232838]">
                      <div className="font-bold text-white">{adminUser?.name || 'Admin Owner'}</div>
                      <div className="text-[10px] text-amber-400 font-medium">Pemilik Outlet Manokwari</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsChangeCredentialsOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-slate-300 hover:text-white hover:bg-[#1e2330] flex items-center space-x-2 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ubah Kata Sandi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setTempSettings({ ...settings });
                        setIsSettingsOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-slate-300 hover:text-white hover:bg-[#1e2330] flex items-center space-x-2 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pengaturan Toko & WA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsSoundModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-slate-300 hover:text-white hover:bg-[#1e2330] flex items-center space-x-2 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Suara Alarm Notifikasi</span>
                    </button>

                    {onSwitchToCustomerPortal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onSwitchToCustomerPortal();
                        }}
                        className="w-full text-left px-4 py-2.5 text-emerald-400 hover:text-emerald-300 hover:bg-[#1e2330] flex items-center space-x-2 cursor-pointer border-t border-[#232838]"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Mode Toko / Pelanggan</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-rose-400 hover:text-rose-300 hover:bg-[#1e2330] flex items-center space-x-2 cursor-pointer border-t border-[#232838]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar / Logout</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Subtab Content Area */}
          <main className="p-4 sm:p-6 space-y-6">
            {/* ========================================================= */}
            {/* SUBTAB: DASHBOARD (Matching Reference Image)               */}
            {/* ========================================================= */}
            {adminSubTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                {/* 4 KPI Cards (Matching Image) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: TOTAL ORDER HARI INI */}
                  <div className="bg-[#141720] border border-[#232838] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#252219] border border-[#3e3420] text-[#e5a93c] flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider text-right">
                        TOTAL ORDER HARI INI
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-white">{totalOrdersToday}</span>
                      <span className="text-xs font-semibold text-slate-400">Order</span>
                    </div>
                  </div>

                  {/* Card 2: PROSES PENGERJAAN */}
                  <div className="bg-[#141720] border border-[#232838] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#252219] border border-[#3e3420] text-[#e5a93c] flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider text-right">
                        PROSES PENGERJAAN
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-white">{inProgressCount}</span>
                      <span className="text-xs font-semibold text-slate-400">Order</span>
                    </div>
                  </div>

                  {/* Card 3: SELESAI HARI INI */}
                  <div className="bg-[#141720] border border-[#232838] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#252219] border border-[#3e3420] text-[#e5a93c] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider text-right">
                        SELESAI HARI INI
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-white">{completedTodayCount}</span>
                      <span className="text-xs font-semibold text-slate-400">Order</span>
                    </div>
                  </div>

                  {/* Card 4: TOTAL PENDAPATAN */}
                  <div className="bg-[#141720] border border-[#232838] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#252219] border border-[#3e3420] text-[#e5a93c] flex items-center justify-center shrink-0">
                        <Coins className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider text-right">
                        TOTAL PENDAPATAN
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline space-x-2">
                      <span className="text-2xl font-black text-white">{formatRupiah(totalRevenueToday)}</span>
                      <span className="text-xs font-semibold text-slate-400">Hari Ini</span>
                    </div>
                  </div>
                </div>

                {/* Full Width Layout: ORDER TERBARU & LAYANAN POPULER */}
                <div className="space-y-6">
                  {/* ORDER TERBARU Block */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#181d28] border border-[#262c3e] p-1 flex items-center justify-center shadow-xs">
                          <img 
                            src="/order-shoe-logo.png" 
                            alt="Logo Order Terbaru" 
                            className="w-full h-full object-contain filter drop-shadow-sm"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== window.location.origin + '/9899434-removebg-preview.png') {
                                target.src = '/9899434-removebg-preview.png';
                              }
                            }}
                          />
                        </div>
                        <h3 className="font-extrabold text-sm tracking-wider uppercase text-white flex items-center gap-2">
                          <span>ORDER TERBARU</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Terupdate
                          </span>
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAdminSubTab('orders')}
                        className="text-xs font-semibold text-slate-400 hover:text-[#e5a93c] transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Lihat Semua</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Order List Cards */}
                    <div className="space-y-2.5">
                      {displayRecentOrders.length === 0 ? (
                        <div className="bg-[#141720] border border-[#232838] rounded-2xl p-8 text-center">
                          <ClipboardList className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-300">Belum ada order tersimpan</p>
                          <p className="text-xs text-slate-500 mt-1">Data order yang tersimpan di sistem akan otomatis muncul di sini secara realtime.</p>
                        </div>
                      ) : (
                        displayRecentOrders.map((order) => {
                          const dateObj = new Date(order.createdAt);
                          const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                          const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

                          return (
                            <div
                              key={order.id}
                              onClick={() => setSelectedInvoiceOrder(order)}
                              className="bg-[#141720] hover:bg-[#191d28] border border-[#232838] hover:border-[#384257] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer shadow-sm group"
                            >
                              {/* Left: Thumbnail & Details */}
                              <div className="flex items-center space-x-3.5">
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingPhotoOrder({ order, shoeIndex: 0 });
                                  }}
                                  title="Klik untuk melihat foto sepatu"
                                  className="relative group/thumb cursor-pointer"
                                >
                                  <ShoeThumbnail 
                                    type={order.shoeDetails?.[0]?.shoeType || order.serviceId} 
                                    photoUrl={order.shoeDetails?.[0]?.photoUrl}
                                    className="w-13 h-13 shrink-0 rounded-xl"
                                    showViewBadge={Boolean(order.shoeDetails?.some(s => s.photoUrl))}
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-white text-xs font-mono">{order.id}</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="font-bold text-slate-200 text-xs">{order.customerName}</span>
                                    {order.deliveryMethod === 'pickup' ? (
                                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                        <span>🛵</span>
                                        <span className="truncate max-w-[100px]">{order.pickupZone || 'Antar-Jemput'}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 text-[10px] border border-slate-700">
                                        <span>🏬 Drop-off</span>
                                      </span>
                                    )}
                                    {order.shoeDetails?.some(s => s.photoUrl) && (
                                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                        <Camera className="w-2.5 h-2.5" />
                                        <span>Ada Foto</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-1">
                                    <span className="flex items-center space-x-1">
                                      <span>🛍️</span>
                                      <span>{order.pairCount} Pasang Sepatu</span>
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center space-x-1">
                                      <span>🏷️</span>
                                      <span>{order.shoeDetails?.[0]?.brandModel || order.serviceName}</span>
                                    </span>
                                    {order.shoeDetails?.some(s => s.photoUrl) ? (
                                      <>
                                        <span>•</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setViewingPhotoOrder({ order, shoeIndex: 0 });
                                          }}
                                          className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center space-x-1 cursor-pointer underline decoration-amber-500/50"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>Lihat Foto ({order.shoeDetails.filter(s => s.photoUrl).length})</span>
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <span>•</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setViewingPhotoOrder({ order, shoeIndex: 0 });
                                          }}
                                          className="text-slate-500 hover:text-slate-300 inline-flex items-center space-x-1 cursor-pointer"
                                        >
                                          <Camera className="w-2.5 h-2.5" />
                                          <span>+ Foto</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Center & Right: Date, Status, Price, Photo Button & Arrow */}
                              <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#232838]">
                                <div className="text-left sm:text-right text-[11px] text-slate-400">
                                  <div>{dateStr}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{timeStr}</div>
                                </div>

                                <div className="text-right">
                                  <div>{renderStatusBadge(order.status)}</div>
                                  <div className="font-bold text-xs text-white font-mono mt-1">
                                    {formatRupiah(order.totalPrice)}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingPhotoOrder({ order, shoeIndex: 0 });
                                  }}
                                  title={order.shoeDetails?.some(s => s.photoUrl) ? "Lihat Foto Sepatu (Ada Foto)" : "Lihat / Tambah Foto"}
                                  className={`p-2 rounded-xl transition-all cursor-pointer border ${
                                    order.shoeDetails?.some(s => s.photoUrl)
                                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 shadow-xs'
                                      : 'bg-[#1b202c] hover:bg-[#252c3d] text-slate-400 hover:text-white border-transparent'
                                  }`}
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                </button>

                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* LAYANAN POPULER Block */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm tracking-wider uppercase text-white">
                        LAYANAN POPULER
                      </h3>
                      <span className="text-[11px] text-slate-400">Layanan Unggulan Shoecare Manokwari</span>
                    </div>

                    {/* 7 Services Grid (Matching Screenshot) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                      {/* 1. CUCI SEPATU */}
                      <button
                        type="button"
                        onClick={() => handleQuickServiceClick('reguler')}
                        className="bg-[#141720] hover:bg-[#1a1e28] border border-[#232838] hover:border-[#e5a93c]/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all group active:scale-95 shadow-sm"
                      >
                        <Footprints className="w-5 h-5 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-200 mt-2 uppercase tracking-tight">
                          CUCI SEPATU
                        </span>
                      </button>

                      {/* 2. DEEP CLEAN */}
                      <button
                        type="button"
                        onClick={() => handleQuickServiceClick('premium')}
                        className="bg-[#141720] hover:bg-[#1a1e28] border border-[#232838] hover:border-[#e5a93c]/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all group active:scale-95 shadow-sm"
                      >
                        <Sparkles className="w-5 h-5 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-200 mt-2 uppercase tracking-tight">
                          DEEP CLEAN
                        </span>
                      </button>

                      {/* 3. LEATHER CARE */}
                      <button
                        type="button"
                        onClick={() => handleQuickServiceClick('leather')}
                        className="bg-[#141720] hover:bg-[#1a1e28] border border-[#232838] hover:border-[#e5a93c]/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all group active:scale-95 shadow-sm"
                      >
                        <ShieldCheck className="w-5 h-5 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-200 mt-2 uppercase tracking-tight">
                          LEATHER CARE
                        </span>
                      </button>

                      {/* 4. ANTI NODA */}
                      <button
                        type="button"
                        onClick={() => handleQuickServiceClick('unyellowing')}
                        className="bg-[#141720] hover:bg-[#1a1e28] border border-[#232838] hover:border-[#e5a93c]/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all group active:scale-95 shadow-sm"
                      >
                        <Droplets className="w-5 h-5 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-200 mt-2 uppercase tracking-tight">
                          ANTI NODA
                        </span>
                      </button>

                      {/* 5. REPAINT SEPATU */}
                      <button
                        type="button"
                        onClick={() => handleQuickServiceClick('repaint')}
                        className="bg-[#141720] hover:bg-[#1a1e28] border border-[#232838] hover:border-[#e5a93c]/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all group active:scale-95 shadow-sm"
                      >
                        <Paintbrush className="w-5 h-5 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-200 mt-2 uppercase tracking-tight">
                          REPAINT SEPATU
                        </span>
                      </button>

                      {/* 6. CUCI SENDAL */}
                      <button
                        type="button"
                        onClick={() => handleQuickServiceClick('sendal')}
                        className="bg-[#141720] hover:bg-[#1a1e28] border border-[#232838] hover:border-[#e5a93c]/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all group active:scale-95 shadow-sm"
                      >
                        <Footprints className="w-5 h-5 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-200 mt-2 uppercase tracking-tight">
                          CUCI SENDAL
                        </span>
                      </button>

                      {/* 7. LAINNYA */}
                      <button
                        type="button"
                        onClick={() => setAdminSubTab('services')}
                        className="bg-[#141720] hover:bg-[#1a1e28] border border-[#232838] hover:border-[#e5a93c]/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all group active:scale-95 shadow-sm"
                      >
                        <LayoutGrid className="w-5 h-5 text-[#e5a93c] group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-200 mt-2 uppercase tracking-tight">
                          LAINNYA
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SUBTAB: DAFTAR ORDER (Complete Manifest Table)            */}
            {/* ========================================================= */}
            {adminSubTab === 'orders' && (
              <AdminOrdersManifest
                orders={orders}
                notifications={notifications}
                settings={settings}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onUpdatePaymentStatus={onUpdatePaymentStatus}
                onUpdateAdminNote={onUpdateAdminNote}
                onMarkAllNotificationsRead={onMarkAllNotificationsRead}
                onDismissNotification={onDismissNotification}
                onDismissNotificationsForOrder={onDismissNotificationsForOrder}
                onViewInvoice={(order) => setSelectedInvoiceOrder(order)}
                onViewPhoto={(order, shoeIndex) => setViewingPhotoOrder({ order, shoeIndex: shoeIndex || 0 })}
                onEditCustomer={(order) => setEditingCustomerOrder(order)}
                onDeleteOrder={(order) => setDeletingOrder(order)}
                onPromptWhatsApp={(order, newStatus) => setPromptWhatsAppModal({ order, newStatus })}
                onConfirmCancel={(order) => setConfirmCancelOrder(order)}
              />
            )}

            {/* ========================================================= */}
            {/* SUBTAB: PELANGGAN (CRM Database)                          */}
            {/* ========================================================= */}
            {adminSubTab === 'customers' && (
              <div className="bg-[#141720] border border-[#232838] rounded-2xl p-5 shadow-xl text-white">
                <CustomerDatabase
                  orders={orders}
                  onDeleteCustomer={onDeleteCustomer}
                  onViewCustomerOrders={(custName) => {
                    setAdminSubTab('orders');
                  }}
                />
              </div>
            )}

            {/* ========================================================= */}
            {/* SUBTAB: LAYANAN & HARGA (Catalog & Pricing)               */}
            {/* ========================================================= */}
            {(adminSubTab === 'services' || adminSubTab === 'pricing') && (
              <div className="bg-[#141720] border border-[#232838] rounded-2xl p-6 shadow-xl space-y-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232838] pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                      DAFTAR LAYANAN & TARIF HARGA
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Katalog layanan aktif cuci sepatu dan penambahan treatment khusus di outlet Manokwari.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempSettings({ ...settings });
                      setIsSettingsOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#e5a93c] text-slate-950 font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-md"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Ubah Konfigurasi Toko</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getServices(settings).map((srv) => (
                    <div key={srv.id} className="p-4 rounded-xl bg-[#0e1117] border border-[#232838] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{srv.name}</span>
                        <span className="font-bold text-[#e5a93c] text-sm font-mono">{formatRupiah(srv.price)}</span>
                      </div>
                      <p className="text-xs text-slate-400">{srv.description}</p>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Estimasi: {srv.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#232838]">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    ADD-ONS / PERAWATAN TAMBAHAN
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    {getAddOns(settings).map((add) => {
                      const isSuede = add.id === 'suede_care';
                      return (
                        <div 
                          key={add.id} 
                          className={`p-3 rounded-xl border ${
                            isSuede
                              ? 'bg-[#181c26] border-amber-500/50 ring-1 ring-amber-500/20'
                              : 'bg-[#0e1117] border-[#232838]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-200 text-xs truncate">{add.name}</span>
                            {isSuede && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                SUEDE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-amber-400 font-mono font-bold">{formatRupiah(add.price)}</div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{add.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SUBTAB: RIWAYAT TRANSAKSI / MODAL AWAL / PENGELUARAN      */}
            {/* ========================================================= */}
            {(adminSubTab === 'history' || adminSubTab === 'capital' || adminSubTab === 'expenses') && (
              <div className="space-y-4">
                {/* Secondary Pill Subnav */}
                <div className="flex items-center space-x-2 p-1.5 bg-[#141720] border border-[#232838] rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('history')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      adminSubTab === 'history' ? 'bg-[#e5a93c] text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Buku Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('capital')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      adminSubTab === 'capital' ? 'bg-[#e5a93c] text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Modal Awal
                  </button>
                </div>

                {adminSubTab === 'capital' ? (
                  <CapitalManager
                    capitals={capitals}
                    expenses={expenses}
                    orders={orders}
                    adminUser={adminUser}
                    onSaveCapital={onSaveCapital}
                    onAddCapital={async (newCap) => {
                      if (onSaveCapital) await onSaveCapital(newCap);
                    }}
                    onUpdateCapital={async (capitalId, updates) => {
                      const cap = capitals.find(c => c.id === capitalId);
                      if (cap && onSaveCapital) await onSaveCapital({ ...cap, ...updates });
                    }}
                    onDeleteCapital={onDeleteCapital}
                    onNavigateToExpenses={() => setAdminSubTab('history')}
                    onNavigateToReport={() => setAdminSubTab('finance')}
                  />
                ) : (
                  <ExpenseManager
                    expenses={expenses}
                    onSaveExpense={onSaveExpense}
                    onAddExpense={async (newExp) => {
                      if (onSaveExpense) await onSaveExpense(newExp);
                    }}
                    onUpdateExpense={async (expenseId, updates) => {
                      const exp = expenses.find(e => e.id === expenseId);
                      if (exp && onSaveExpense) await onSaveExpense({ ...exp, ...updates });
                    }}
                    onDeleteExpense={onDeleteExpense}
                    adminUser={adminUser}
                    onNavigateToReport={() => setAdminSubTab('finance')}
                  />
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* SUBTAB: LAPORAN (Financial P&L)                           */}
            {/* ========================================================= */}
            {adminSubTab === 'finance' && (
              <div className="bg-[#141720] border border-[#232838] rounded-2xl p-5 shadow-xl text-white">
                <FinancialReport
                  orders={orders}
                  expenses={expenses}
                  capitals={capitals}
                  settings={settings}
                  adminUser={adminUser}
                  onViewInvoice={(order) => setSelectedInvoiceOrder(order)}
                  onNavigateToExpenses={() => setAdminSubTab('history')}
                  onNavigateToCapital={() => setAdminSubTab('capital')}
                />
              </div>
            )}

            {/* ========================================================= */}
            {/* SUBTAB: LACAK PESANAN                                     */}
            {/* ========================================================= */}
            {adminSubTab === 'track' && (
              <div className="bg-[#141720] border border-[#232838] rounded-2xl p-5 shadow-xl text-white">
                <OrderTracker
                  orders={orders}
                  initialSearchId={trackingOrderId}
                  isAdminMode={true}
                  onUpdateOrderStatus={onUpdateOrderStatus}
                  onUpdatePaymentStatus={onUpdatePaymentStatus}
                  onUpdateAdminNote={onUpdateAdminNote}
                  onViewInvoice={(order) => setSelectedInvoiceOrder(order)}
                  onSelectOrderToTrack={(id) => setTrackingOrderId(id)}
                  onEditCustomer={(order) => setEditingCustomerOrder(order)}
                  onDeleteOrder={(order) => setDeletingOrder(order)}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ========================================================= */}
      {/* GLOBAL MODALS                                             */}
      {/* ========================================================= */}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          settings={settings}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* High-Resolution Shoe Photo Viewer Modal */}
      {viewingPhotoOrder && (
        <OrderPhotoViewerModal
          order={viewingPhotoOrder.order}
          initialShoeIndex={viewingPhotoOrder.shoeIndex || 0}
          onClose={() => setViewingPhotoOrder(null)}
          onUpdateShoePhoto={handleUpdateShoePhoto}
        />
      )}

      {/* Sound Alarm Picker Modal */}
      {isSoundModalOpen && (
        <SoundPickerModal
          currentSound={settings.alarmSound || 'melodi'}
          onSelectSound={(newSound) => {
            onSaveSettings({
              ...settings,
              alarmSound: newSound
            });
            setIsSoundModalOpen(false);
          }}
          onClose={() => setIsSoundModalOpen(false)}
        />
      )}

      {/* Change Credentials Modal */}
      {isChangeCredentialsOpen && adminCredentials && onSaveCredentials && (
        <ChangeCredentialsModal
          credentials={adminCredentials}
          onSave={onSaveCredentials}
          onClose={() => setIsChangeCredentialsOpen(false)}
        />
      )}

      {/* Delete Order Modal */}
      {deletingOrder && onDeleteOrder && (
        <DeleteOrderModal
          order={deletingOrder}
          onConfirm={async () => {
            await onDeleteOrder(deletingOrder.id);
            setDeletingOrder(null);
          }}
          onClose={() => setDeletingOrder(null)}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomerOrder && onEditCustomer && (
        <EditCustomerModal
          order={editingCustomerOrder}
          onSave={async (orderId, updated) => {
            await onEditCustomer(orderId, updated);
            setEditingCustomerOrder(null);
          }}
          onClose={() => setEditingCustomerOrder(null)}
        />
      )}

      {/* Outlet Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#141720] rounded-3xl p-6 max-w-lg w-full border border-[#232838] shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#232838] pb-3">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-[#e5a93c]" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Pengaturan Toko & WhatsApp
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSaveSettings(tempSettings);
                setIsSettingsOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nomor WhatsApp Outlet Admin
                </label>
                <input
                  type="text"
                  value={tempSettings.adminPhone}
                  onChange={(e) => setTempSettings({ ...tempSettings, adminPhone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1117] border border-[#262c39] focus:border-[#e5a93c] focus:outline-none text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Jam Buka Operasional
                </label>
                <input
                  type="text"
                  value={tempSettings.openingHours}
                  onChange={(e) => setTempSettings({ ...tempSettings, openingHours: e.target.value })}
                  placeholder="08:00 - 20:00 WIT"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1117] border border-[#262c39] focus:border-[#e5a93c] focus:outline-none text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Alamat Outlet
                </label>
                <textarea
                  rows={2}
                  value={tempSettings.storeAddress}
                  onChange={(e) => setTempSettings({ ...tempSettings, storeAddress: e.target.value })}
                  placeholder="Jl. Merdeka No. 12, Manokwari, Papua Barat"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1117] border border-[#262c39] focus:border-[#e5a93c] focus:outline-none text-white text-xs"
                />
              </div>

              {/* Add-ons Pricing Setting */}
              <div className="pt-2 border-t border-[#232838]">
                <label className="block text-slate-300 font-semibold mb-2">
                  Penyesuaian Tarif Add-On / Perawatan Tambahan (Rp)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {getAddOns(tempSettings).map((addon) => (
                    <div key={addon.id} className="p-2.5 rounded-xl bg-[#0e1117] border border-[#262c39] flex flex-col justify-between">
                      <span className="block text-[11px] font-bold text-slate-200 truncate" title={addon.name}>
                        {addon.name}
                      </span>
                      <div className="flex items-center space-x-1.5 mt-1.5">
                        <span className="text-[10px] text-slate-500 font-mono">Rp</span>
                        <input
                          type="number"
                          step={1000}
                          value={tempSettings.addOnPrices?.[addon.id] ?? addon.price}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setTempSettings({
                              ...tempSettings,
                              addOnPrices: {
                                ...(tempSettings.addOnPrices || {}),
                                [addon.id]: val
                              }
                            });
                          }}
                          className="w-full px-2 py-1 rounded-lg bg-[#141720] border border-[#262c39] focus:border-[#e5a93c] text-white text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#232838]">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#262c39] text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#e5a93c] hover:bg-[#d99b2e] text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Prompt Confirmation Modal */}
      {promptWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#141720] rounded-3xl p-6 max-w-md w-full border border-[#232838] shadow-2xl text-white space-y-4">
            <div className="flex items-center space-x-3 border-b border-[#232838] pb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Kirim Konfirmasi WhatsApp</h3>
                <p className="text-xs text-slate-400">
                  Kepada {promptWhatsAppModal.order.customerName} ({promptWhatsAppModal.order.customerPhone})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Status pengerjaan pesanan #{promptWhatsAppModal.order.id} telah diperbarui ke status baru. Ingin segera mengirim pesan WhatsApp otomatis ke pelanggan?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPromptWhatsAppModal(null)}
                className="px-4 py-2.5 rounded-xl border border-[#262c39] text-slate-300 text-xs font-bold cursor-pointer"
              >
                Nanti Saja
              </button>
              <a
                href={buildWhatsAppCustomerConfirmUrl(promptWhatsAppModal.order, promptWhatsAppModal.newStatus)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPromptWhatsAppModal(null)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim WA Sekarang</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel Order Modal */}
      {confirmCancelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#141720] rounded-3xl p-6 max-w-md w-full border border-[#232838] shadow-2xl text-white space-y-4">
            <div className="flex items-center space-x-3 border-b border-[#232838] pb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Batalkan Pesanan</h3>
                <p className="text-xs text-slate-400 font-mono">#{confirmCancelOrder.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin membatalkan pesanan milik <strong>{confirmCancelOrder.customerName}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-[#262c39] text-slate-300 text-xs font-bold cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateOrderStatus(confirmCancelOrder.id, 'dibatalkan');
                  setConfirmCancelOrder(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
