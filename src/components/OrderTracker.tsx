import React, { useState, useEffect } from 'react';
import { CustomerOrder, OrderStatus } from '../types';
import { formatRupiah } from '../utils/storage';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Sparkles, 
  PackageCheck, 
  AlertCircle,
  HelpCircle,
  Calendar,
  Layers,
  Phone,
  User,
  MessageSquare,
  FileText,
  Edit3,
  ChevronRight,
  ShieldCheck,
  Send,
  Plus
} from 'lucide-react';

interface OrderTrackerProps {
  orders: CustomerOrder[];
  initialSearchId?: string;
  onSelectOrderToTrack?: (orderId: string) => void;
  isAdminMode?: boolean;
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
  onUpdateAdminNote?: (orderId: string, note: string) => void;
  onViewInvoice?: (order: CustomerOrder) => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  orders,
  initialSearchId = '',
  onSelectOrderToTrack,
  isAdminMode = false,
  onUpdateOrderStatus,
  onUpdateAdminNote,
  onViewInvoice
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchId);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [newProgressNote, setNewProgressNote] = useState('');
  const [quickStatusFilter, setQuickStatusFilter] = useState<'all' | 'menunggu_konfirmasi' | 'dalam_proses' | 'siap_ambil' | 'selesai'>('all');

  // Keep selected order in sync when orders array updates (e.g. status changed)
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) {
        setSelectedOrder(updated);
      }
    }
  }, [orders]);

  useEffect(() => {
    if (initialSearchId) {
      setSearchQuery(initialSearchId);
      const found = orders.find(
        o => o.id.toLowerCase() === initialSearchId.toLowerCase()
      );
      if (found) {
        setSelectedOrder(found);
        setHasSearched(true);
      }
    } else if (isAdminMode && orders.length > 0 && !selectedOrder) {
      // In admin mode, auto-select the latest order if none selected
      setSelectedOrder(orders[0]);
    }
  }, [initialSearchId, orders, isAdminMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setHasSearched(true);
    const cleanQuery = searchQuery.trim().toLowerCase();
    
    // Search by ID or Phone or Name
    const found = orders.find(
      o => o.id.toLowerCase() === cleanQuery || 
           o.customerPhone.includes(cleanQuery) ||
           o.customerName.toLowerCase().includes(cleanQuery)
    );

    setSelectedOrder(found || null);
  };

  const handleSelectOrder = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setSearchQuery(order.id);
    setHasSearched(true);
    if (onSelectOrderToTrack) {
      onSelectOrderToTrack(order.id);
    }
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (!selectedOrder || !onUpdateOrderStatus) return;
    onUpdateOrderStatus(selectedOrder.id, newStatus);
  };

  const handleAddProgressNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newProgressNote.trim() || !onUpdateAdminNote) return;
    
    // Append or set progress note
    const updatedNotes = selectedOrder.adminNotes 
      ? `${selectedOrder.adminNotes} | ${newProgressNote.trim()}`
      : newProgressNote.trim();
      
    onUpdateAdminNote(selectedOrder.id, updatedNotes);
    setNewProgressNote('');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'menunggu_konfirmasi':
        return {
          label: 'Menunggu Konfirmasi',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          step: 1
        };
      case 'dijemput':
        return {
          label: 'Sepatu Dijemput / Diterima',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          step: 2
        };
      case 'dalam_proses':
        return {
          label: 'Sedang Dicuci & Treatment',
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          step: 3
        };
      case 'siap_ambil':
        return {
          label: 'Siap Diambil / Diantar',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          step: 4
        };
      case 'selesai':
        return {
          label: 'Pesanan Selesai',
          color: 'bg-slate-100 text-slate-800 border-slate-300',
          step: 5
        };
      case 'dibatalkan':
        return {
          label: 'Dibatalkan',
          color: 'bg-rose-100 text-rose-800 border-rose-300',
          step: 0
        };
    }
  };

  const statusSteps = [
    { step: 1, title: 'Pesanan Didaftarkan', desc: 'Menunggu verifikasi admin' },
    { step: 2, title: 'Diterima Toko / Kurir', desc: 'Sepatu telah sampai ke studio' },
    { step: 3, title: 'Proses Pencucian', desc: 'Deep cleaning & pengeringan aman' },
    { step: 4, title: 'Siap Diambil / Diantar', desc: 'Sepatu bersih & wangi siap pakai' },
    { step: 5, title: 'Pesanan Selesai', desc: 'Serah terima sukses' },
  ];

  // Quick filter for admin orders list
  const filteredQuickOrders = orders.filter(o => {
    if (quickStatusFilter === 'all') return true;
    return o.status === quickStatusFilter;
  });

  const generateWhatsAppCustomerUrl = (order: CustomerOrder) => {
    let cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const message = encodeURIComponent(
      `Halo Kak *${order.customerName}*,\n\n` +
      `Update terkini untuk pencucian sepatu Anda di *SipSepatu Care Studio*:\n` +
      `• No. Resi: *${order.id}*\n` +
      `• Layanan: ${order.serviceName} (${order.pairCount} pasang)\n` +
      `• Status Saat Ini: *${getStatusBadge(order.status).label.toUpperCase()}*\n` +
      (order.adminNotes ? `• Catatan Studio: _${order.adminNotes}_\n` : '') +
      `• Total Biaya: ${formatRupiah(order.totalPrice)}\n\n` +
      `Terima kasih telah mempercayakan perawatan sepatu Anda kepada kami! 🙌`
    );
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Search className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isAdminMode ? 'Lacak & Penelusuran Pesanan Studio' : 'Lacak Status Cuci Sepatu'}
            </h2>
            {isAdminMode && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                Admin Mode
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {isAdminMode 
              ? 'Pantau progres pencucian tiap pasang sepatu, kelola status pengerjaan, dan perbarui riwayat catatan pelanggan.' 
              : 'Masukkan Nomor Pesanan (contoh: SP-9821) atau Nomor WhatsApp untuk melihat progres pencucian sepatu Anda.'}
          </p>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="input-search-order"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="No. Resi / Nama / WhatsApp..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>
          <button
            type="submit"
            id="btn-search-order"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Admin Mode Quick Order Picker Carousel/Grid */}
      {isAdminMode && orders.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Pilih Cepat Pesanan Masuk ({filteredQuickOrders.length} Ditemukan)</span>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto text-[11px] pb-1">
              <button
                type="button"
                onClick={() => setQuickStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                  quickStatusFilter === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setQuickStatusFilter('menunggu_konfirmasi')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                  quickStatusFilter === 'menunggu_konfirmasi'
                    ? 'bg-amber-500 text-white font-semibold'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Baru ({orders.filter(o => o.status === 'menunggu_konfirmasi').length})
              </button>
              <button
                type="button"
                onClick={() => setQuickStatusFilter('dalam_proses')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                  quickStatusFilter === 'dalam_proses'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                Dicuci ({orders.filter(o => o.status === 'dalam_proses').length})
              </button>
              <button
                type="button"
                onClick={() => setQuickStatusFilter('siap_ambil')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                  quickStatusFilter === 'siap_ambil'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Siap ({orders.filter(o => o.status === 'siap_ambil').length})
              </button>
            </div>
          </div>

          {/* Quick Select Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            {filteredQuickOrders.slice(0, 10).map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              const badge = getStatusBadge(ord.status);
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => handleSelectOrder(ord)}
                  className={`px-3 py-2 rounded-xl text-left border shrink-0 transition-all cursor-pointer flex items-center space-x-2.5 ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-slate-900">{ord.id}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${badge.color}`}>
                        {badge.label.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate max-w-[120px]">
                      {ord.customerName}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Results Display */}
      {selectedOrder ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Top Banner Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900">
                  {selectedOrder.id}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getStatusBadge(selectedOrder.status).color}`}>
                  {getStatusBadge(selectedOrder.status).label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Pelanggan: <span className="font-semibold text-slate-800">{selectedOrder.customerName}</span> • WhatsApp: <span className="font-mono text-slate-700">{selectedOrder.customerPhone}</span> • Didaftarkan {new Date(selectedOrder.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* WhatsApp notification action */}
              <a
                href={generateWhatsAppCustomerUrl(selectedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                title="Kirim Pesan Pembaruan WhatsApp ke Pelanggan"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim WA Pelanggan</span>
              </a>

              {/* View Invoice button */}
              {onViewInvoice && (
                <button
                  type="button"
                  onClick={() => onViewInvoice(selectedOrder)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Lihat Nota</span>
                </button>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Tahapan Pengerjaan Sepatu</span>
              <span className="text-xs font-normal text-slate-500 lowercase">
                tahap {getStatusBadge(selectedOrder.status).step} dari 5
              </span>
            </h3>
            
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {statusSteps.map((stepItem) => {
                  const currentStepNum = getStatusBadge(selectedOrder.status).step;
                  const isCompleted = stepItem.step < currentStepNum;
                  const isCurrent = stepItem.step === currentStepNum;

                  return (
                    <div
                      key={stepItem.step}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500/30'
                          : isCompleted
                          ? 'border-slate-200 bg-slate-50 text-slate-700'
                          : 'border-slate-100 bg-white opacity-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-emerald-500 text-slate-950 font-extrabold animate-pulse'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepItem.step}
                        </div>
                        <span className="text-xs font-bold text-slate-900">{stepItem.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">{stepItem.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ADMIN ACTION CONTROLS (Only visible in admin mode) */}
          {isAdminMode && onUpdateOrderStatus && (
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Panel Kontrol Pengerjaan Admin
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Ubah status pengerjaan atau tambahkan log catatan progres sepatu
                </span>
              </div>

              {/* Status Switcher Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Pembaruan Cepat Status:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('menunggu_konfirmasi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedOrder.status === 'menunggu_konfirmasi'
                        ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-white/50'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    1. Menunggu Konfirmasi
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange('dijemput')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedOrder.status === 'dijemput'
                        ? 'bg-blue-500 text-white shadow-md ring-2 ring-white/50'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    2. Diterima Toko / Dijemput
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange('dalam_proses')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedOrder.status === 'dalam_proses'
                        ? 'bg-purple-500 text-white shadow-md ring-2 ring-white/50'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    3. Sedang Dicuci & Treatment
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange('siap_ambil')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedOrder.status === 'siap_ambil'
                        ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-white/50'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    4. Siap Diambil / Diantar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange('selesai')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedOrder.status === 'selesai'
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-white/50'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    5. Selesai (Lunas)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange('dibatalkan')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedOrder.status === 'dibatalkan'
                        ? 'bg-rose-600 text-white shadow-md ring-2 ring-white/50'
                        : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
                    }`}
                  >
                    Batalkan
                  </button>
                </div>
              </div>

              {/* Add Progress Note Form */}
              {onUpdateAdminNote && (
                <form onSubmit={handleAddProgressNote} className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Tambah Catatan Khusus Pengerjaan (Studio Log):</span>
                    {selectedOrder.adminNotes && (
                      <span className="text-[11px] text-emerald-400 italic">
                        Catatan aktif: {selectedOrder.adminNotes}
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProgressNote}
                      onChange={(e) => setNewProgressNote(e.target.value)}
                      placeholder="Contoh: Midsole selesai unyellowing, masuk tahap pengeringan uv..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Simpan Catatan</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Left: Shoes Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Detail Sepatu ({selectedOrder.pairCount} Pasang)</span>
              </h4>

              <div className="space-y-2">
                {selectedOrder.shoeDetails.map((shoe, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">
                        #{idx + 1} {shoe.brandModel || 'Sepatu Tanpa Merk'}
                      </span>
                      <span className="text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {shoe.shoeType}
                      </span>
                    </div>
                    {shoe.color && (
                      <p className="text-slate-600">Warna: <span className="font-medium text-slate-800">{shoe.color}</span></p>
                    )}
                    {shoe.conditionNotes && (
                      <p className="text-slate-500 italic">Kondisi Awal: {shoe.conditionNotes}</p>
                    )}
                    {shoe.photoUrl && (
                      <div className="pt-1">
                        <img 
                          src={shoe.photoUrl} 
                          alt="Kondisi awal" 
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200 mt-1" 
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Service, Delivery, and Customer Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Paket Layanan & Biaya</span>
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{selectedOrder.serviceName}</span>
                    <span className="font-bold text-slate-900">{formatRupiah(selectedOrder.servicePrice)} / pasang</span>
                  </div>
                  {selectedOrder.selectedAddOns.length > 0 && (
                    <div className="flex justify-between text-slate-600 border-t border-slate-200/60 pt-1.5">
                      <span>Add-on: {selectedOrder.selectedAddOns.join(', ')}</span>
                      <span className="font-semibold">+{formatRupiah(selectedOrder.addOnsTotal)}</span>
                    </div>
                  )}
                  {selectedOrder.deliveryFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>
                        Ongkir Kurir Maxim ({selectedOrder.maximVehicle === 'mobil' ? 'Mobil' : 'Motor'}{selectedOrder.maximTripType === 'pp' ? ' PP' : ''}):
                      </span>
                      <span className="font-semibold">+{formatRupiah(selectedOrder.deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                    <span>Total Pembayaran:</span>
                    <span className="text-emerald-700">{formatRupiah(selectedOrder.totalPrice)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>Pengambilan & Kontak Pelanggan</span>
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <p className="font-semibold text-slate-800">
                    {selectedOrder.deliveryMethod === 'pickup' 
                      ? `🛵 Antar-Jemput Kurir Maxim ${selectedOrder.maximVehicle === 'mobil' ? 'Car (Mobil)' : 'Bike (Motor)'}` 
                      : '🏬 Antar Sendiri ke Outlet'}
                  </p>
                  {selectedOrder.pickupZone && (
                    <p className="text-slate-700"><span className="font-medium">Zona Wilayah:</span> {selectedOrder.pickupZone}</p>
                  )}
                  {selectedOrder.pickupAddress && (
                    <p className="text-slate-600"><span className="font-medium">Alamat:</span> {selectedOrder.pickupAddress}</p>
                  )}
                  {selectedOrder.pickupNotes && (
                    <p className="text-slate-500 italic"><span className="font-medium">Catatan Lokasi:</span> {selectedOrder.pickupNotes}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log / Status History */}
          {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Catatan Riwayat Pengerjaan ({selectedOrder.statusHistory.length} Log)
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.statusHistory.map((hist, i) => (
                  <div key={i} className="flex items-start space-x-3 text-xs p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800">
                          {new Date(hist.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(hist.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                        {hist.adminName && (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 rounded font-mono">
                            {hist.adminName}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mt-0.5">{hist.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : hasSearched ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Pesanan Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500">
            Tidak ada data pesanan dengan kata kunci "<span className="font-semibold text-slate-700">{searchQuery}</span>". Pastikan nomor ID atau no HP sudah sesuai.
          </p>
        </div>
      ) : null}
    </div>
  );
};
