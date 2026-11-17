import React, { useState, useMemo } from 'react';
import { CustomerOrder, AdminNotification, AdminSettings, OrderStatus } from '../types';
import { formatRupiah, buildWhatsAppCustomerConfirmUrl, buildWhatsAppCourierDispatchUrl } from '../utils/storage';
import { 
  Bell, 
  CheckCheck, 
  Search, 
  FileText, 
  Clock, 
  MessageSquare,
  Edit3,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  Trash2,
  Copy,
  X,
  UserCheck,
  Camera,
  Eye,
  Truck,
  Navigation
} from 'lucide-react';
import { ShoeThumbnail } from './ShoeThumbnail';

interface AdminOrdersManifestProps {
  orders: CustomerOrder[];
  notifications: AdminNotification[];
  settings: AdminSettings;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, adminNote?: string) => void;
  onUpdatePaymentStatus: (orderId: string, status: 'belum_bayar' | 'sudah_bayar') => void;
  onUpdateAdminNote: (orderId: string, note: string) => void;
  onMarkAllNotificationsRead: () => void;
  onDismissNotification?: (notifId: string) => void;
  onDismissNotificationsForOrder?: (orderId: string) => void;
  onViewInvoice: (order: CustomerOrder) => void;
  onViewPhoto?: (order: CustomerOrder, shoeIndex?: number) => void;
  onEditCustomer: (order: CustomerOrder) => void;
  onDeleteOrder: (order: CustomerOrder) => void;
  onPromptWhatsApp: (order: CustomerOrder, newStatus: OrderStatus) => void;
  onConfirmCancel: (order: CustomerOrder) => void;
}

export const AdminOrdersManifest: React.FC<AdminOrdersManifestProps> = ({
  orders,
  notifications,
  settings,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onUpdateAdminNote,
  onMarkAllNotificationsRead,
  onDismissNotification,
  onDismissNotificationsForOrder,
  onViewInvoice,
  onViewPhoto,
  onEditCustomer,
  onDeleteOrder,
  onPromptWhatsApp,
  onConfirmCancel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus>(() => {
    if (orders.some(o => o.status === 'menunggu_konfirmasi')) return 'menunggu_konfirmasi';
    return 'dalam_proses';
  });
  const [editingNoteOrderId, setEditingNoteOrderId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Active unread notifications
  const unreadNotifs = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);

  // Orders not cancelled
  const manifestOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'dibatalkan' && !(o as any).isCompletedFromManifest);
  }, [orders]);

  const pendingCount = manifestOrders.filter(o => o.status === 'menunggu_konfirmasi').length;
  const inProgressCount = manifestOrders.filter(o => o.status === 'dalam_proses').length;
  const readyCount = manifestOrders.filter(o => o.status === 'siap_ambil').length;
  const completedCount = orders.filter(o => o.status === 'selesai').length;

  const filteredOrders = useMemo(() => {
    const sourceOrders = statusFilter === 'selesai' ? orders : manifestOrders;
    return sourceOrders.filter((o) => {
      const matchSearch =
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerPhone.includes(searchQuery) ||
        o.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [manifestOrders, orders, searchQuery, statusFilter]);

  const handleStartEditNote = (order: CustomerOrder) => {
    setEditingNoteOrderId(order.id);
    setEditingNoteText(order.adminNotes || '');
  };

  const handleSaveNote = (orderId: string) => {
    onUpdateAdminNote(orderId, editingNoteText);
    setEditingNoteOrderId(null);
  };

  const handleCopyReceiptId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    setCopiedOrderId(orderId);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'menunggu_konfirmasi':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'dijemput':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'dalam_proses':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'siap_ambil':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'selesai':
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
      case 'dibatalkan':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'menunggu_konfirmasi': return 'Menunggu';
      case 'dijemput': return 'Dijemput';
      case 'dalam_proses': return 'Diproses';
      case 'siap_ambil': return 'Siap Ambil';
      case 'selesai': return 'Selesai';
      case 'dibatalkan': return 'Dibatalkan';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-white">
      {/* Realtime Alert & Notifications Dispatch Center */}
      <div className="bg-[#141720] border border-[#232838] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232838] pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="relative p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bell className="w-5 h-5" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-black tracking-tight text-white uppercase">Notifikasi Order Masuk</h2>
                {unreadNotifs.length > 0 ? (
                  <span className="text-[10px] bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                    {unreadNotifs.length} Belum Dibaca
                  </span>
                ) : (
                  <span className="text-[10px] bg-[#1e2330] text-slate-400 px-2 py-0.5 rounded-full border border-[#2b3244]">
                    Semua Terbaca
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sistem otomatis mencatat pesanan setiap pelanggan submit formulir.
              </p>
            </div>
          </div>

          {unreadNotifs.length > 0 && (
            <button
              type="button"
              onClick={onMarkAllNotificationsRead}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 py-1.5 px-3 rounded-xl bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/40 transition-all cursor-pointer w-fit"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}
        </div>

        {/* Notifications Feed */}
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          {unreadNotifs.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-1">
              Tidak ada notifikasi pesanan baru yang belum dibaca.
            </p>
          ) : (
            unreadNotifs.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e1117] border border-amber-500/30 shadow-xs transition-all hover:bg-[#121620]"
              >
                <div className="flex items-start sm:items-center space-x-3">
                  <div className="w-2 h-2 rounded-full shrink-0 bg-amber-400 animate-pulse mt-1 sm:mt-0" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{n.customerName}</span>
                      <span className="text-amber-400 font-medium">({n.serviceName})</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#232838]">
                  <div className="text-left sm:text-right">
                    <span className="font-bold text-amber-400 font-mono">{formatRupiah(n.totalPrice)}</span>
                  </div>
                  {onDismissNotification && (
                    <button
                      type="button"
                      onClick={() => onDismissNotification(n.id)}
                      title="Tandai telah dibaca"
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/20 transition-all cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Selesai</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Orders Manifest Deck */}
      <div className="bg-[#141720] border border-[#232838] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#232838] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#181d28] border border-[#262c3e] p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img 
                  src="/order-shoe-logo.png" 
                  alt="Logo Order" 
                  className="w-full h-full object-contain filter drop-shadow-sm"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + '/9899434-removebg-preview.png') {
                      target.src = '/9899434-removebg-preview.png';
                    }
                  }}
                />
              </div>
              <span>DAFTAR MANIFEST PESANAN MASUK</span>
              <span className="text-[10px] font-bold bg-[#1e2330] text-amber-400 px-2 py-0.5 rounded-full border border-[#2b3244]">
                {filteredOrders.length} Pesanan
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola status pengerjaan, chat WhatsApp konfirmasi, serta cetak nota invoice digital.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, resi, nomor HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[#262c39] bg-[#0e1117] text-white focus:border-[#e5a93c] focus:outline-none transition-all placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'menunggu_konfirmasi', label: 'Menunggu', count: pendingCount },
            { id: 'dalam_proses', label: 'Diproses', count: inProgressCount },
            { id: 'siap_ambil', label: 'Siap Diambil', count: readyCount },
            { id: 'selesai', label: 'Selesai', count: completedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as OrderStatus)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === tab.id
                  ? 'bg-[#e5a93c] text-slate-950 shadow-md'
                  : 'bg-[#1a1e28] text-slate-300 hover:bg-[#232838] border border-[#282f40]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id ? 'bg-slate-950/20 text-slate-950' : 'bg-[#0e1117] text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Manifest Table */}
        <div className="overflow-x-auto rounded-xl border border-[#232838]">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-[#0e1117] border-b border-[#232838] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Resi & Tanggal</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Layanan & Sepatu</th>
                <th className="px-4 py-3">Total Biaya</th>
                <th className="px-4 py-3">Status Pengerjaan</th>
                <th className="px-4 py-3 text-right">Aksi & Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2330]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada pesanan yang sesuai dengan filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#181c26] transition-colors">
                    <td className="px-4 py-3 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-white text-xs">{order.id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyReceiptId(order.id)}
                          title="Salin Resi"
                          className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-white text-xs">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{order.customerPhone}</div>
                      {order.deliveryMethod === 'pickup' ? (
                        <div className="mt-1 space-y-0.5">
                          <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/25">
                            <span>🛵</span>
                            <span className="font-semibold truncate max-w-[140px]">{order.pickupZone || 'Antar-Jemput'}</span>
                          </span>
                          {order.pickupAddress && (
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(order.pickupAddress + ', Manokwari, Papua Barat')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-[10px] text-slate-400 hover:text-emerald-300 truncate max-w-[170px] underline"
                              title={`Buka Navigasi Maps: ${order.pickupAddress}`}
                            >
                              📍 {order.pickupAddress}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block mt-1 text-[10px] bg-[#1e2330] text-slate-400 px-1.5 py-0.2 rounded border border-[#2b3244]">
                          🏬 Drop-off Outlet
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        <div 
                          onClick={() => onViewPhoto && onViewPhoto(order)}
                          className="relative shrink-0 cursor-pointer group"
                          title={order.shoeDetails?.some(s => s.photoUrl) ? "Klik untuk melihat foto sepatu" : "Klik untuk kelola/unggah foto"}
                        >
                          <ShoeThumbnail 
                            photoUrl={order.shoeDetails?.[0]?.photoUrl} 
                            className="w-10 h-10 rounded-lg shrink-0"
                            showViewBadge={false}
                          />
                          {order.shoeDetails?.some(s => s.photoUrl) && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                              <Camera className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="font-bold text-amber-400 text-xs">
                            {order.serviceName} ({order.pairCount} Pasang)
                          </div>
                          <div className="text-[11px] text-slate-300 truncate max-w-[180px]">
                            {order.shoeDetails?.[0]?.brandModel || 'Sepatu Casual'}
                          </div>
                          {order.shoeDetails?.some(s => s.photoUrl) ? (
                            <button
                              type="button"
                              onClick={() => onViewPhoto && onViewPhoto(order)}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold inline-flex items-center space-x-1 mt-0.5 cursor-pointer underline decoration-amber-500/50"
                            >
                              <Eye className="w-2.5 h-2.5" />
                              <span>Lihat Foto ({order.shoeDetails.filter(s => s.photoUrl).length})</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onViewPhoto && onViewPhoto(order)}
                              className="text-[10px] text-slate-500 hover:text-slate-300 inline-flex items-center space-x-1 mt-0.5 cursor-pointer"
                            >
                              <Camera className="w-2.5 h-2.5" />
                              <span>Tambah Foto</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-white font-mono text-xs">{formatRupiah(order.totalPrice)}</div>
                      <button
                        type="button"
                        onClick={() => onUpdatePaymentStatus(order.id, order.paymentStatus === 'sudah_bayar' ? 'belum_bayar' : 'sudah_bayar')}
                        className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-md cursor-pointer border ${
                          order.paymentStatus === 'sudah_bayar'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {order.paymentStatus === 'sudah_bayar' ? '✓ Lunas' : 'Belum Bayar'}
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          const newStat = e.target.value as OrderStatus;
                          onUpdateOrderStatus(order.id, newStat);
                          if (newStat === 'siap_ambil' || newStat === 'selesai') {
                            onPromptWhatsApp(order, newStat);
                          }
                        }}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border appearance-none cursor-pointer bg-[#0e1117] ${getStatusBadge(order.status)}`}
                      >
                        <option value="menunggu_konfirmasi">Menunggu</option>
                        <option value="dijemput">Dijemput</option>
                        <option value="dalam_proses">Diproses</option>
                        <option value="siap_ambil">Siap Ambil</option>
                        <option value="selesai">Selesai</option>
                      </select>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onViewPhoto && onViewPhoto(order)}
                          title={order.shoeDetails?.some(s => s.photoUrl) ? "Lihat Foto Sepatu (Ada Foto)" : "Lihat / Unggah Foto Sepatu"}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer relative ${
                            order.shoeDetails?.some(s => s.photoUrl)
                              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-xs'
                              : 'bg-[#1e2330] hover:bg-[#2b3244] text-slate-400 hover:text-white border-transparent'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {order.shoeDetails?.some(s => s.photoUrl) && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewInvoice(order)}
                          title="Cetak / Lihat Nota Invoice"
                          className="p-1.5 rounded-lg bg-[#1e2330] hover:bg-[#2b3244] text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={buildWhatsAppCustomerConfirmUrl(order, order.status)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Kirim Pesan WhatsApp ke Pelanggan"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                        {order.deliveryMethod === 'pickup' && (
                          <a
                            href={buildWhatsAppCourierDispatchUrl(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Kirim Penugasan ke Kurir / Driver via WhatsApp"
                            className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditCustomer(order)}
                          title="Edit Data Pelanggan"
                          className="p-1.5 rounded-lg bg-[#1e2330] hover:bg-[#2b3244] text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onConfirmCancel(order)}
                          title="Batalkan Pesanan"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
