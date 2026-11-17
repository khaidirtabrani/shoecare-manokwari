import React, { useState, useMemo } from 'react';
import { 
  InitialCapitalItem, 
  CapitalSourceType, 
  ExpenseItem, 
  CustomerOrder, 
  AdminUser 
} from '../types';
import { formatRupiah } from '../utils/storage';
import { 
  Landmark, 
  Plus, 
  Search, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Edit3, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  CreditCard, 
  Building2, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

interface CapitalManagerProps {
  capitals: InitialCapitalItem[];
  expenses?: ExpenseItem[];
  orders?: CustomerOrder[];
  adminUser?: AdminUser | null;
  onSaveCapital?: (capital: InitialCapitalItem) => Promise<void> | void;
  onAddCapital?: (capital: InitialCapitalItem) => Promise<void> | void;
  onUpdateCapital?: (capitalId: string, updates: Partial<InitialCapitalItem>) => Promise<void> | void;
  onDeleteCapital?: (capitalId: string) => Promise<void> | void;
  onNavigateToExpenses?: () => void;
  onNavigateToReport?: () => void;
}

export const CAPITAL_SOURCE_CONFIG: Record<CapitalSourceType, {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}> = {
  modal_pribadi: {
    label: 'Modal Pribadi Pemilik',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    description: 'Setoran modal dari pemilik usaha langsung'
  },
  investor_partner: {
    label: 'Mitra / Investor Usaha',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    description: 'Dana investasi atau bagi hasil dari mitra kerja'
  },
  saldo_awal_kas: {
    label: 'Saldo Awal Kas',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    description: 'Kas awal pembukaan laci kasir / outlet'
  },
  pinjaman_usaha: {
    label: 'Pinjaman Modal Kerja',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    description: 'Dana pinjaman bank / KUR / pembiayaan usaha'
  },
  lainnya: {
    label: 'Sumber Lainnya',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    description: 'Sumber dana setoran modal lainnya'
  }
};

export const CapitalManager: React.FC<CapitalManagerProps> = ({
  capitals,
  expenses = [],
  orders = [],
  adminUser,
  onSaveCapital,
  onAddCapital,
  onUpdateCapital,
  onDeleteCapital,
  onNavigateToExpenses,
  onNavigateToReport
}) => {
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCapital, setEditingCapital] = useState<InitialCapitalItem | null>(null);
  const [deletingCapital, setDeletingCapital] = useState<InitialCapitalItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    date: string;
    title: string;
    source: CapitalSourceType;
    amount: string;
    paymentMethod: 'tunai' | 'transfer' | 'rekening_bisnis';
    recipientOrBank: string;
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    title: '',
    source: 'modal_pribadi',
    amount: '',
    paymentMethod: 'rekening_bisnis',
    recipientOrBank: 'Rekening Kas Operasional Toko',
    notes: ''
  });

  // Financial Calculations
  const totalCapitalIn = useMemo(() => {
    return capitals.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [capitals]);

  const totalCapexExpenses = useMemo(() => {
    return expenses
      .filter(e => e.category === 'belanja_modal')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const totalOpexExpenses = useMemo(() => {
    return expenses
      .filter(e => e.category !== 'belanja_modal')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const totalAllExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const totalRevenueCompleted = useMemo(() => {
    return orders
      .filter(o => o.status === 'selesai' || o.paymentStatus === 'sudah_bayar')
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  }, [orders]);

  // Current Estimated Cash Position = Total Capital + Inflow Revenue - Total Outflow Expenses
  const currentEstimatedCash = totalCapitalIn + totalRevenueCompleted - totalAllExpenses;

  // Capital Recovery Rate (Payback %)
  const paybackRate = totalCapitalIn > 0 
    ? Math.min(Math.round((totalRevenueCompleted / totalCapitalIn) * 100), 100) 
    : 0;

  // Filtered Capital Items
  const filteredCapitals = useMemo(() => {
    return capitals.filter(item => {
      // Source filter
      if (sourceFilter !== 'all' && item.source !== sourceFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesNotes = (item.notes || '').toLowerCase().includes(query);
        const matchesCreator = (item.createdBy || '').toLowerCase().includes(query);
        const matchesBank = (item.recipientOrBank || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesNotes && !matchesCreator && !matchesBank) {
          return false;
        }
      }
      return true;
    });
  }, [capitals, sourceFilter, searchQuery]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCapital(null);
    setFormError(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      source: 'modal_pribadi',
      amount: '',
      paymentMethod: 'rekening_bisnis',
      recipientOrBank: 'Rekening Kas Operasional Toko',
      notes: ''
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cap: InitialCapitalItem) => {
    setEditingCapital(cap);
    setFormError(null);
    setFormData({
      date: cap.date,
      title: cap.title,
      source: cap.source,
      amount: cap.amount.toString(),
      paymentMethod: cap.paymentMethod,
      recipientOrBank: cap.recipientOrBank || '',
      notes: cap.notes || ''
    });
    setIsFormModalOpen(true);
  };

  // Submit Capital Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Mohon isi uraian/nama setoran modal.');
      return;
    }

    const parsedAmount = parseInt(formData.amount.replace(/[^0-9]/g, ''), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError('Mohon masukkan nominal modal yang valid (lebih dari Rp 0).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCapital) {
        // Update existing
        const updatedItem: InitialCapitalItem = {
          ...editingCapital,
          date: formData.date,
          title: formData.title.trim(),
          source: formData.source,
          amount: parsedAmount,
          paymentMethod: formData.paymentMethod,
          recipientOrBank: formData.recipientOrBank.trim() || undefined,
          notes: formData.notes.trim() || undefined
        };

        if (onUpdateCapital) {
          await onUpdateCapital(editingCapital.id, {
            date: formData.date,
            title: formData.title.trim(),
            source: formData.source,
            amount: parsedAmount,
            paymentMethod: formData.paymentMethod,
            recipientOrBank: formData.recipientOrBank.trim() || undefined,
            notes: formData.notes.trim() || undefined
          });
        }
        if (onSaveCapital) {
          await onSaveCapital(updatedItem);
        }
        setStatusNotice({ message: 'Data modal awal berhasil diperbarui.', type: 'success' });
      } else {
        // Create new
        const newId = `CAP-${Date.now().toString().slice(-4)}`;
        const newItem: InitialCapitalItem = {
          id: newId,
          date: formData.date,
          title: formData.title.trim(),
          source: formData.source,
          amount: parsedAmount,
          paymentMethod: formData.paymentMethod,
          recipientOrBank: formData.recipientOrBank.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          createdBy: adminUser?.name || 'Owner',
          createdAt: new Date().toISOString()
        };

        if (onAddCapital) {
          await onAddCapital(newItem);
        }
        if (onSaveCapital) {
          await onSaveCapital(newItem);
        }
        setStatusNotice({ message: 'Setoran modal awal baru berhasil dicatat & disinkronkan ke Cloud.', type: 'success' });
      }

      setIsFormModalOpen(false);
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err) {
      console.error('Failed to save capital:', err);
      setFormError('Gagal menyimpan data modal. Mohon periksa koneksi internet atau coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Capital Action
  const handleConfirmDelete = async () => {
    if (!deletingCapital) return;
    setIsSubmitting(true);
    try {
      if (onDeleteCapital) {
        await onDeleteCapital(deletingCapital.id);
      }
      setStatusNotice({ message: 'Catatan modal awal berhasil dihapus.', type: 'success' });
      setDeletingCapital(null);
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err) {
      console.error('Failed to delete capital:', err);
      setStatusNotice({ message: 'Gagal menghapus catatan modal.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold">
              <Landmark className="w-3.5 h-3.5 text-indigo-400" />
              <span>Buku Ekuitas & Kas Usaha</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Manajemen Modal Awal Usaha</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Catat dan pantau seluruh modal awal pendirian outlet Shoecare Manokwari, setoran kas tunai, suntikan dana investor/mitra, serta analisis alokasi belanja modal dan cadangan kas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-tambah-modal-awal"
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Modal Awal Baru</span>
            </button>

            {onNavigateToReport && (
              <button
                type="button"
                onClick={onNavigateToReport}
                className="inline-flex items-center space-x-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Lihat Laporan Laba Rugi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Notice Toast */}
      {statusNotice && (
        <div className={`p-4 rounded-2xl border flex items-center space-x-3 text-xs font-bold animate-fade-in ${
          statusNotice.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {statusNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusNotice.message}</span>
        </div>
      )}

      {/* KPI Cards: Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Modal Awal */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Total Modal Awal Masuk
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatRupiah(totalCapitalIn)}
            </div>
            <div className="flex items-center space-x-1.5 mt-1.5 text-xs text-slate-500">
              <PiggyBank className="w-3.5 h-3.5 text-indigo-500" />
              <span>{capitals.length} kali pencatatan modal</span>
            </div>
          </div>
        </div>

        {/* Card 2: Alokasi Belanja Modal (CapEx) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Alokasi Belanja Modal (CapEx)
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-700 tracking-tight">
              {formatRupiah(totalCapexExpenses)}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
              <span>Mesin cuci, dryer UV, rak display</span>
              {onNavigateToExpenses && (
                <button
                  type="button"
                  onClick={onNavigateToExpenses}
                  className="text-amber-600 font-bold hover:underline inline-flex items-center"
                >
                  Detail &rarr;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Posisi Kas & Cadangan Modal */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Estimasi Kas & Cadangan
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black tracking-tight ${
              currentEstimatedCash >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              {formatRupiah(currentEstimatedCash)}
            </div>
            <div className="flex items-center space-x-1 mt-1.5 text-xs text-slate-500">
              <span>Modal + Omset - Pengeluaran</span>
            </div>
          </div>
        </div>

        {/* Card 4: Progress Balik Modal (Payback %) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Tingkat Balik Modal (Payback)
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-700 tracking-tight flex items-baseline gap-1.5">
              <span>{paybackRate}%</span>
              <span className="text-xs font-normal text-slate-500">tercover</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(paybackRate, 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Alokasi Modal & Insight Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2 mb-4">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Analisis Struktur & Alokasi Modal Usaha</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="font-bold text-slate-700 flex items-center justify-between">
              <span>1. Belanja Aset Modal (CapEx)</span>
              <span className="text-amber-700 font-extrabold">{formatRupiah(totalCapexExpenses)}</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Pengeluaran untuk aset tetap (mesin cuci putar, lemari dryer UV, rak besi display). Nilai aset ini bertahan lama untuk operasional harian.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="font-bold text-slate-700 flex items-center justify-between">
              <span>2. Bahan Baku & Operasional (OpEx)</span>
              <span className="text-rose-700 font-extrabold">{formatRupiah(totalOpexExpenses)}</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Biaya habis pakai seperti sabun cleaner konsentrat, parfum sepatu, kantong ziplock kemasan, dan biaya listrik/air operasional toko.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
            <div className="font-bold text-indigo-900 flex items-center justify-between">
              <span>3. Total Omset Cuci Sepatu Masuk</span>
              <span className="text-emerald-700 font-extrabold">{formatRupiah(totalRevenueCompleted)}</span>
            </div>
            <p className="text-indigo-700/80 text-[11px] leading-relaxed">
              Pemasukan dari pelanggan yang sudah melunasi / selesai dikerjakan. Omset ini secara bertahap menutup modal awal pendirian.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1">Sumber Modal:</span>
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sourceFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({capitals.length})
          </button>
          {Object.entries(CAPITAL_SOURCE_CONFIG).map(([key, cfg]) => {
            const count = capitals.filter(c => c.source === key).length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSourceFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sourceFilter === key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari deskripsi, bank, catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Capital History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Riwayat Catatan Modal Awal Usaha
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredCapitals.length} dari total {capitals.length} data setoran modal
            </p>
          </div>
          
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Modal</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Uraian & Deskripsi</th>
                <th className="px-6 py-4">Sumber Modal</th>
                <th className="px-6 py-4">Alokasi Kas / Rekening</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4 text-right">Nominal (Rp)</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCapitals.length > 0 ? (
                filteredCapitals.map((item) => {
                  const sourceConfig = CAPITAL_SOURCE_CONFIG[item.source] || CAPITAL_SOURCE_CONFIG.lainnya;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(item.date).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <span className="font-bold text-slate-900 block text-sm">
                            {item.title}
                          </span>
                          {item.notes && (
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {item.notes}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            ID: {item.id} &bull; Dicatat oleh: {item.createdBy || 'Admin'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${sourceConfig.badgeBg} ${sourceConfig.badgeText} ${sourceConfig.badgeBorder}`}>
                          {sourceConfig.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-700 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <Landmark className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.recipientOrBank || 'Kas Toko Tunai'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="capitalize px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {item.paymentMethod === 'rekening_bisnis' ? 'Rekening Bisnis' : item.paymentMethod}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="text-base font-black text-emerald-700">
                          {formatRupiah(item.amount)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Data Modal"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCapital(item)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Catatan Modal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <PiggyBank className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-slate-700">Belum Ada Data Modal Awal</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery 
                        ? 'Tidak ada data modal yang sesuai dengan pencarian Anda.' 
                        : 'Klik tombol "Catat Modal Awal Baru" untuk menambahkan setoran modal pertama.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>

            {filteredCapitals.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50/80 border-t-2 border-slate-200 font-black text-xs text-slate-800">
                  <td colSpan={5} className="px-6 py-4 text-right uppercase tracking-wider">
                    Total Modal ({filteredCapitals.length} Item Terpilih):
                  </td>
                  <td className="px-6 py-4 text-right text-base text-emerald-700">
                    {formatRupiah(filteredCapitals.reduce((sum, c) => sum + (c.amount || 0), 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal: Tambah / Edit Modal Awal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingCapital ? 'Edit Catatan Modal Awal' : 'Catat Modal Awal Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Isi data setoran modal untuk Shoecare Manokwari
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tanggal Penyetoran Modal *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Uraian / Judul Setoran Modal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Setoran Modal Kas Awal Pendirian Toko"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Sumber Modal *
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as CapitalSourceType }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium cursor-pointer"
                  >
                    {Object.entries(CAPITAL_SOURCE_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Metode Penyetoran *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium cursor-pointer"
                  >
                    <option value="rekening_bisnis">Rekening Bisnis</option>
                    <option value="transfer">Transfer Bank</option>
                    <option value="tunai">Kas Tunai Toko</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Nominal Modal (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    placeholder="Contoh: 5000000"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-slate-900"
                  />
                  {formData.amount && (
                    <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
                      {formatRupiah(parseInt(formData.amount, 10) || 0)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Rekening / Kas Penampung
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kas Toko / Rekening BRI Bisnis"
                    value={formData.recipientOrBank}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientOrBank: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Catatan Tambahan / No. Bukti Setor (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan peruntukan dana, nama penyetor, nomor bukti transfer..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md cursor-pointer flex items-center space-x-2"
                >
                  {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingCapital ? 'Simpan Perubahan' : 'Simpan Modal Awal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus */}
      {deletingCapital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Hapus Catatan Modal Awal?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Apakah Anda yakin ingin menghapus data modal &quot;<span className="font-bold text-slate-800">{deletingCapital.title}</span>&quot; senilai <span className="font-black text-emerald-700">{formatRupiah(deletingCapital.amount)}</span>?
            </p>

            <div className="flex items-center justify-center space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setDeletingCapital(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
