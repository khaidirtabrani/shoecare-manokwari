import React, { useState, useEffect } from 'react';
import { CustomerOrder, AdminNotification, AdminSettings, OrderStatus, AdminUser } from '../types';
import { formatRupiah, buildWhatsAppCustomerConfirmUrl } from '../utils/storage';
import { playNotificationChime } from '../utils/audio';
import { InvoiceModal } from './InvoiceModal';
import { 
  Bell, 
  CheckCheck, 
  Search, 
  FileText, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  Package, 
  Settings, 
  Volume2, 
  MessageSquare,
  Edit3,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  LogOut,
  UserCheck,
  FileSpreadsheet,
  MapPin,
  Activity,
  Zap,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Truck,
  Building2,
  Calendar,
  X
} from 'lucide-react';
import { FinancialReport } from './FinancialReport';
import { OrderTracker } from './OrderTracker';
import { RevenueChart } from './RevenueChart';

interface AdminDashboardProps {
  orders: CustomerOrder[];
  notifications: AdminNotification[];
  settings: AdminSettings;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, adminNote?: string) => void;
  onUpdatePaymentStatus: (orderId: string, status: 'belum_bayar' | 'sudah_bayar') => void;
  onUpdateAdminNote: (orderId: string, note: string) => void;
  onMarkAllNotificationsRead: () => void;
  onSaveSettings: (settings: AdminSettings) => void;
  adminUser?: AdminUser | null;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  notifications,
  settings,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onUpdateAdminNote,
  onMarkAllNotificationsRead,
  onSaveSettings,
  adminUser,
  onLogout
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<CustomerOrder | null>(null);
  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'orders' | 'track' | 'finance'>('dashboard');
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');
  
  // Settings modal / edit state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<AdminSettings>({ ...settings });

  // Inline note editing
  const [editingNoteOrderId, setEditingNoteOrderId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Audio testing feedback state
  const [isPlayingChime, setIsPlayingChime] = useState(false);

  // Live WIT (Eastern Indonesia Time) Clock
  const [witTime, setWitTime] = useState<string>('');
  const [witDate, setWitDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsTime: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jayapura',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      const optionsDate: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jayapura',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      };
      setWitTime(new Intl.DateTimeFormat('id-ID', optionsTime).format(now));
      setWitDate(new Intl.DateTimeFormat('id-ID', optionsDate).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Unread notifications
  const unreadNotifs = notifications.filter(n => !n.isRead);

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const matchesFilter = activeFilter === 'all' || order.status === activeFilter;
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Analytics counts
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'dibatalkan' ? o.totalPrice : 0), 0);
  const pendingCount = orders.filter(o => o.status === 'menunggu_konfirmasi').length;
  const pickedUpCount = orders.filter(o => o.status === 'dijemput').length;
  const inProgressCount = orders.filter(o => o.status === 'dalam_proses').length;
  const readyCount = orders.filter(o => o.status === 'siap_ambil').length;
  const completedCount = orders.filter(o => o.status === 'selesai').length;

  const handleStartEditNote = (order: CustomerOrder) => {
    setEditingNoteOrderId(order.id);
    setEditingNoteText(order.adminNotes || '');
  };

  const handleSaveNote = (orderId: string) => {
    onUpdateAdminNote(orderId, editingNoteText);
    setEditingNoteOrderId(null);
  };

  const handleTestChime = () => {
    setIsPlayingChime(true);
    playNotificationChime();
    setTimeout(() => setIsPlayingChime(false), 1200);
  };

  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(tempSettings);
    setIsSettingsOpen(false);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'menunggu_konfirmasi':
        return 'bg-amber-500/10 text-amber-700 border-amber-300';
      case 'dijemput':
        return 'bg-sky-500/10 text-sky-700 border-sky-300';
      case 'dalam_proses':
        return 'bg-purple-500/10 text-purple-700 border-purple-300';
      case 'siap_ambil':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300';
      case 'selesai':
        return 'bg-slate-500/10 text-slate-700 border-slate-300';
      case 'dibatalkan':
        return 'bg-rose-500/10 text-rose-700 border-rose-300';
    }
  };

  const getStatusDot = (status: OrderStatus) => {
    switch (status) {
      case 'menunggu_konfirmasi': return 'bg-amber-500 animate-pulse';
      case 'dijemput': return 'bg-sky-500 animate-pulse';
      case 'dalam_proses': return 'bg-purple-500 animate-pulse';
      case 'siap_ambil': return 'bg-emerald-500';
      case 'selesai': return 'bg-slate-400';
      case 'dibatalkan': return 'bg-rose-500';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'menunggu_konfirmasi': return 'Menunggu Konfirmasi';
      case 'dijemput': return 'Sepatu Dijemput';
      case 'dalam_proses': return 'Sedang Dicuci';
      case 'siap_ambil': return 'Siap Diambil';
      case 'selesai': return 'Selesai';
      case 'dibatalkan': return 'Dibatalkan';
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Executive Command Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 border border-slate-800 shadow-2xl shadow-slate-950/30">
        {/* Ambient Radial Lights */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        {/* Decorative Grid Mesh */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Brand & Outlet Status */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-lg shadow-emerald-500/10 border border-white/10">
                <img 
                  src="/src/assets/images/shoecare_manokwari_logo_1788629081132.jpg" 
                  alt="Logo Shoecare Manokwari" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider w-fit">
                  <span>Admin Operating Deck</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono mt-1 ml-1">
                  Terminal Manajemen Terpadu
                </span>
              </div>

              <span className="hidden sm:inline-flex items-center space-x-1 text-xs text-slate-400 font-mono">
                <span>•</span>
               
              </span>

              {adminUser && (
                <span className="inline-flex items-center space-x-1.5 text-xs bg-white/10 text-slate-200 border border-white/15 px-3 py-1 rounded-full font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{adminUser.name}</span>
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Pusat Kendali Operasional</span>
                <span className="text-emerald-400 text-base font-normal">| Manokwari</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Manajemen antrean laundry sepatu, status pengerjaan, notifikasi order realtime, dan cetak invoice digital.
              </p>
            </div>
          </div>

          {/* Controls: Live Clock, Sound Chime, Settings, Logout */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Live WIT Clock Card */}
            <div className="px-4 py-2 rounded-2xl bg-white/[0.06] border border-white/[0.1] text-right">
              <div className="flex items-center justify-end space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                  {witTime || '--:--:--'} WIT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                {witDate || 'Manokwari, Papua Barat'}
              </p>
            </div>

            {/* Test Audio Chime */}
            <button
              id="btn-admin-test-chime"
              onClick={handleTestChime}
              title="Tes Suara Notifikasi Lonceng"
              className={`p-2.5 rounded-2xl border transition-all flex items-center space-x-2 text-xs font-bold cursor-pointer ${
                isPlayingChime 
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 scale-105' 
                  : 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/10'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${isPlayingChime ? 'animate-bounce' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline">Tes Alarm</span>
            </button>

            {/* Settings Button */}
            <button
              id="btn-admin-open-settings"
              onClick={() => {
                setTempSettings({ ...settings });
                setIsSettingsOpen(true);
              }}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 hover:text-white flex items-center space-x-2 text-xs font-bold transition-all cursor-pointer"
              title="Konfigurasi Toko & WhatsApp Admin"
            >
              <Settings className="w-4 h-4 text-slate-300" />
              <span>Pengaturan</span>
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                id="btn-admin-logout"
                type="button"
                onClick={onLogout}
                title="Keluar dari sesi admin"
                className="p-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 flex items-center space-x-1.5 text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs: Dashboard vs Pesanan Masuk vs Lacak Pesanan vs Laporan Keuangan */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl border border-slate-200/80">
        <button
          id="tab-admin-dashboard"
          type="button"
          onClick={() => setAdminSubTab('dashboard')}
          className={`inline-flex items-center space-x-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            adminSubTab === 'dashboard'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Dashboard</span>
        </button>

        <button
          id="tab-admin-orders"
          type="button"
          onClick={() => setAdminSubTab('orders')}
          className={`inline-flex items-center space-x-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            adminSubTab === 'orders'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Pesanan Masuk</span>
          {pendingCount > 0 ? (
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {pendingCount} Baru
            </span>
          ) : (
            <span className="bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">
              {orders.length}
            </span>
          )}
        </button>

        <button
          id="tab-admin-track"
          type="button"
          onClick={() => setAdminSubTab('track')}
          className={`inline-flex items-center space-x-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            adminSubTab === 'track'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Search className="w-4 h-4 text-emerald-400" />
          <span>Lacak & Penelusuran Resi</span>
          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Pelacak
          </span>
        </button>

        <button
          id="tab-admin-finance"
          type="button"
          onClick={() => setAdminSubTab('finance')}
          className={`inline-flex items-center space-x-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            adminSubTab === 'finance'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Laporan Keuangan & Omset</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Excel & PDF
          </span>
        </button>
      </div>

      {adminSubTab === 'dashboard' ? (
        <div className="space-y-8 animate-fade-in">
          {/* High-Impact Analytics KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Menunggu Konfirmasi */}
            <div className="p-5 rounded-3xl border bg-white border-slate-200/90 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Perlu Konfirmasi</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900">{pendingCount}</span>
                <span className="text-xs text-amber-700 font-bold">Order Baru</span>
              </div>
            </div>

            {/* Card 2: Dalam Pengerjaan */}
            <div className="p-5 rounded-3xl border bg-white border-slate-200/90 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Dalam Treatment</span>
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900">{inProgressCount + pickedUpCount}</span>
                <span className="text-xs text-purple-700 font-bold">Sedang Dicuci</span>
              </div>
            </div>

            {/* Card 3: Siap Diambil */}
            <div className="p-5 rounded-3xl border bg-white border-slate-200/90 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Siap Diambil</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900">{readyCount}</span>
                <span className="text-xs text-emerald-700 font-bold">Siap Diserahkan</span>
              </div>
            </div>

            {/* Card 4: Total Omset Estimasi */}
            <div className="p-5 rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Omset</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {formatRupiah(totalRevenue)}
                </span>
              </div>
            </div>
          </div>

          <RevenueChart orders={orders} />
          
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
            <Activity className="w-8 h-8 text-emerald-500" />
            <h4 className="text-sm font-bold text-slate-900">Selamat Datang Kembali, Admin!</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Pantau seluruh aktivitas operasional dan grafik pendapatan Anda melalui dashboard ini. 
              Gunakan menu di atas untuk mengelola pesanan atau melihat laporan detail.
            </p>
          </div>
        </div>
      ) : adminSubTab === 'finance' ? (
        <FinancialReport
          orders={orders}
          settings={settings}
          adminUser={adminUser}
          onViewInvoice={(order) => setSelectedInvoiceOrder(order)}
        />
      ) : adminSubTab === 'track' ? (
        <OrderTracker
          orders={orders}
          initialSearchId={trackingOrderId}
          isAdminMode={true}
          onUpdateOrderStatus={onUpdateOrderStatus}
          onUpdateAdminNote={onUpdateAdminNote}
          onViewInvoice={(order) => setSelectedInvoiceOrder(order)}
          onSelectOrderToTrack={(id) => setTrackingOrderId(id)}
        />
          ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Realtime Alert & Notifications Dispatch Center */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3.5">
              <div className="flex items-center space-x-3">
                <div className="relative p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Bell className="w-5 h-5" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-black tracking-tight text-white">Notifikasi Order Masuk</h2>
                    {unreadNotifs.length > 0 ? (
                      <span className="text-xs bg-rose-500 text-white font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                        {unreadNotifs.length} Belum Dibaca
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-700">
                        Semua Terbaca
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sistem otomatis membunyikan alarm lonceng dan mencatat pesanan setiap pelanggan submit formulir.
                  </p>
                </div>
              </div>

              {unreadNotifs.length > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllNotificationsRead}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 py-1.5 px-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 hover:bg-emerald-900/60 transition-all cursor-pointer w-fit"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Tandai Semua Dibaca</span>
                </button>
              )}
            </div>

            {/* Notifications Feed */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">Belum ada notifikasi pesanan masuk.</p>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 transition-all ${
                      !n.isRead 
                        ? 'bg-slate-800/90 border border-emerald-500/40 shadow-xs' 
                        : 'bg-slate-800/40 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${!n.isRead ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{n.customerName}</span>
                          <span className="text-emerald-400 font-medium">({n.serviceName})</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-emerald-400 font-mono">{formatRupiah(n.totalPrice)}</span>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIT
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Orders Management Manifest Deck */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Header & Controls Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Daftar Manifest Pesanan Masuk</span>
                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                    {filteredOrders.length} Pesanan
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola status pengerjaan, chat WhatsApp konfirmasi, serta cetak nota invoice digital.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, resi, nomor HP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 text-xs rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'Semua Status', count: orders.length },
                { id: 'menunggu_konfirmasi', label: 'Menunggu', count: pendingCount },
                { id: 'dijemput', label: 'Dijemput', count: pickedUpCount },
                { id: 'dalam_proses', label: 'Diproses', count: inProgressCount },
                { id: 'siap_ambil', label: 'Siap Diambil', count: readyCount },
                { id: 'selesai', label: 'Selesai', count: completedCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Orders Work-Ticket List */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Tidak ada pesanan yang sesuai</p>
                <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau ganti filter status di atas.</p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilter('all');
                    }}
                    className="mt-3 text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Reset Filter Pencarian
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const waUrl = buildWhatsAppCustomerConfirmUrl(order);

                  return (
                    <div
                      key={order.id}
                      id={`order-card-${order.id}`}
                      className="p-5 sm:p-6 rounded-3xl border border-slate-200/90 hover:border-slate-300 bg-white transition-all space-y-4 shadow-xs hover:shadow-md"
                    >
                      {/* Top Bar of Work Ticket */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* Order ID Badge */}
                          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs">
                            <span className="text-emerald-400">#</span>
                            <span>{order.id}</span>
                          </div>

                          {/* Status Pill with Pulsing Dot */}
                          <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${getStatusBadge(order.status)}`}>
                            <span className={`w-2 h-2 rounded-full ${getStatusDot(order.status)}`} />
                            <span>{getStatusLabel(order.status)}</span>
                          </div>

                          {/* Payment Status Pill */}
                          <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                            order.paymentStatus === 'sudah_bayar' 
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300' 
                              : 'bg-rose-500/10 text-rose-700 border-rose-300'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'sudah_bayar' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{order.paymentStatus === 'sudah_bayar' ? 'LUNAS' : 'BELUM BAYAR'}</span>
                          </div>

                          {/* Timestamp */}
                          <span className="text-xs text-slate-400 flex items-center space-x-1 font-mono">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} WIT
                            </span>
                          </span>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Track Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setTrackingOrderId(order.id);
                              setAdminSubTab('track');
                            }}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer border border-blue-200/60"
                            title="Buka Menu Lacak untuk Pesanan Ini"
                          >
                            <Search className="w-3.5 h-3.5 text-blue-600" />
                            <span>Lacak Resi</span>
                          </button>

                          {/* WhatsApp Customer Button */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors border border-emerald-200/80 cursor-pointer"
                            title="Kirim Pesan WhatsApp ke Pelanggan"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Chat WA Pelanggan</span>
                          </a>

                          {/* Invoice Modal Button */}
                          <button
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors border border-slate-200/80 cursor-pointer"
                            title="Lihat Nota Invoice Digital"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-600" />
                            <span>Cetak Nota</span>
                          </button>
                        </div>
                      </div>

                      {/* 3-Column Manifest Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                        {/* Col 1: Pelanggan & Pengiriman */}
                        <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
                          <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">
                            Data Pelanggan
                          </span>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{order.customerName}</p>
                            <p className="text-slate-600 font-mono mt-0.5 font-medium">{order.customerPhone}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60">
                            <span className="text-[11px] font-semibold text-slate-500">Metode Pengantaran:</span>
                            <div className="mt-1">
                              {order.deliveryMethod === 'pickup' ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center space-x-1.5 text-slate-950 bg-[#FEE300] px-2.5 py-1 rounded-lg font-black text-[11px] border border-amber-400 shadow-2xs">
                                    <span>🛵 Maxim {order.maximVehicle === 'mobil' ? 'Car (Mobil)' : 'Bike (Motor)'}</span>
                                    {order.maximTripType === 'pp' && <span className="bg-slate-900 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-bold">PP</span>}
                                  </span>
                                  {order.pickupZone && (
                                    <p className="text-[11px] font-medium text-slate-700">
                                      Zona: <span className="font-bold text-slate-900">{order.pickupZone}</span>
                                      {order.pickupDistanceKm ? ` (±${order.pickupDistanceKm} km)` : ''}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg font-bold border border-emerald-200">
                                  <Building2 className="w-3 h-3 text-emerald-600" />
                                  <span>Drop-off Toko</span>
                                </span>
                              )}
                            </div>
                            {order.pickupAddress && (
                              <p className="text-slate-600 mt-1.5 text-[11px] leading-relaxed bg-white p-2 rounded-lg border border-slate-200/80">
                                <span className="font-semibold text-slate-700">Alamat:</span> {order.pickupAddress}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Col 2: Spesifikasi Sepatu & Layanan */}
                        <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
                          <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">
                            Layanan & Sepatu
                          </span>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{order.serviceName}</p>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                              {order.pairCount} Pasang Sepatu
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                            {order.shoeDetails.map((shoe, idx) => (
                              <div key={idx} className="p-2 rounded-xl bg-white border border-slate-200/80 text-[11px]">
                                <span className="font-bold text-slate-800">#{idx + 1} {shoe.brandModel || 'Sepatu'}</span>
                                <div className="text-slate-500 text-[10px] mt-0.5 flex flex-wrap gap-1">
                                  <span className="bg-slate-100 px-1.5 py-0.2 rounded font-medium">{shoe.shoeType}</span>
                                  {shoe.color && <span className="bg-slate-100 px-1.5 py-0.2 rounded font-medium">{shoe.color}</span>}
                                </div>
                              </div>
                            ))}
                          </div>

                          {order.selectedAddOns.length > 0 && (
                            <div className="pt-1 text-[11px] text-slate-600">
                              <span className="font-semibold text-slate-700">Add-on: </span>
                              <span>{order.selectedAddOns.join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Col 3: Biaya & Kontrol Status */}
                        <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200">
                          <div className="flex justify-between items-baseline border-b border-slate-200/80 pb-2">
                            <span className="text-slate-500 font-semibold text-xs">Total Pembayaran:</span>
                            <div className="text-right">
                              <span className="font-black text-base text-emerald-700 font-mono block">
                                {formatRupiah(order.totalPrice)}
                              </span>
                              <span className={`text-[10px] font-bold ${order.paymentStatus === 'sudah_bayar' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {order.paymentStatus === 'sudah_bayar' ? 'Sudah Lunas' : 'Belum Dibayar'}
                              </span>
                            </div>
                          </div>

                          {/* Payment Status Toggle */}
                          <div className="flex items-center justify-between gap-2 bg-white/50 p-2 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Status Bayar:</span>
                            <div className="flex bg-slate-200 p-0.5 rounded-lg">
                              <button
                                onClick={() => onUpdatePaymentStatus(order.id, 'belum_bayar')}
                                className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                                  order.paymentStatus === 'belum_bayar'
                                    ? 'bg-rose-500 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                Belum
                              </button>
                              <button
                                onClick={() => onUpdatePaymentStatus(order.id, 'sudah_bayar')}
                                className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                                  order.paymentStatus === 'sudah_bayar'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                Lunas
                              </button>
                            </div>
                          </div>

                          {/* Status Selector Dropdown */}
                          <div>
                            <label 
                              htmlFor={`select-status-${order.id}`}
                              className="block text-[11px] font-bold text-slate-700 mb-1.5"
                            >
                              Perbarui Status Pengerjaan:
                            </label>
                            <select
                              id={`select-status-${order.id}`}
                              value={order.status}
                              onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs transition-all cursor-pointer"
                            >
                              <option value="menunggu_konfirmasi">🟡 Menunggu Konfirmasi</option>
                              <option value="dijemput">🔵 Sepatu Dijemput / Diterima</option>
                              <option value="dalam_proses">🟣 Sedang Dicuci & Diproses</option>
                              <option value="siap_ambil">🟢 Siap Diambil / Diantar</option>
                              <option value="selesai">⚪ Selesai (Diterima Customer)</option>
                              <option value="dibatalkan">🔴 Dibatalkan</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Internal Note Drawer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex-1 mr-4">
                          {editingNoteOrderId === order.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                                placeholder="Tulis catatan internal untuk staf toko..."
                                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <button
                                onClick={() => handleSaveNote(order.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1 cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-700">Catatan Staf:</span>
                              <span className="italic text-slate-600">{order.adminNotes || 'Belum ada catatan internal.'}</span>
                              <button
                                onClick={() => handleStartEditNote(order)}
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Edit Catatan Internal"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Modal if opened */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          settings={settings}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Pengaturan Outlet & Admin</h3>
                  <p className="text-xs text-slate-500">Konfigurasi kontak notifikasi WhatsApp dan tarif ongkir.</p>
                </div>
              </div>

              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettingsSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Admin (Penerima Notifikasi Order)
                </label>
                <input
                  type="text"
                  value={tempSettings.adminPhone}
                  onChange={(e) => setTempSettings({ ...tempSettings, adminPhone: e.target.value })}
                  placeholder="Contoh: 6282239096626"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Format awalan 62 (contoh: 6282239096626) agar integrasi link pesan WhatsApp instan berjalan lancar.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Toko / Brand
                </label>
                <input
                  type="text"
                  value={tempSettings.storeName}
                  onChange={(e) => setTempSettings({ ...tempSettings, storeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Gerai / Outlet
                </label>
                <input
                  type="text"
                  value={tempSettings.storeAddress}
                  onChange={(e) => setTempSettings({ ...tempSettings, storeAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Standar Tarif Maxim Transportasi Manokwari
                </label>
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5 text-slate-700">
                  <div className="flex items-center space-x-2">
                    <span className="bg-[#FEE300] text-slate-900 font-black px-1.5 py-0.5 rounded text-[10px] border border-amber-400">
                      MAXIM MANOKWARI
                    </span>
                    <span className="font-bold text-slate-900 text-xs">Ketentuan Tarif Papua Barat:</span>
                  </div>
                  <p>• <strong>Maxim Bike (Motor)</strong>: Tarif dasar Rp 8.000 (0-2 km), +Rp 2.500/km berikutnya</p>
                  <p>• <strong>Maxim Car (Mobil)</strong>: Tarif dasar Rp 12.000 (0-3 km), +Rp 4.000/km berikutnya</p>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-amber-200/60">
                    Sistem secara otomatis menghitung ongkir pelanggan berdasarkan zonasi kelurahan di Kota Manokwari (Sanggeng, Wosi, Rendani, Amban, Arfai, Sowi, dll).
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
