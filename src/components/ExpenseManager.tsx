import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Wallet, 
  ShoppingBag, 
  Sparkles, 
  Tag, 
  Edit3, 
  Trash2, 
  TrendingDown, 
  Layers, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Users,
  Package,
  Wrench,
  HelpCircle,
  ArrowDownRight
} from 'lucide-react';
import { ExpenseItem, ExpenseCategory, AdminUser } from '../types';
import { formatRupiah } from '../utils/storage';

interface ExpenseManagerProps {
  expenses: ExpenseItem[];
  adminUser?: AdminUser | null;
  onSaveExpense?: (expense: ExpenseItem) => Promise<void> | void;
  onAddExpense?: (expense: ExpenseItem) => Promise<void> | void;
  onUpdateExpense?: (expenseId: string, updates: Partial<ExpenseItem>) => Promise<void> | void;
  onDeleteExpense?: (expenseId: string) => Promise<void> | void;
  onNavigateToReport?: () => void;
}

export const CATEGORY_CONFIG: Record<ExpenseCategory, { 
  label: string; 
  shortLabel: string;
  color: string; 
  badgeBg: string; 
  badgeText: string; 
  borderColor: string;
  icon: React.ElementType;
  description: string;
}> = {
  belanja_modal: {
    label: 'Belanja Modal (Investasi Alat/Mesin)',
    shortLabel: 'Belanja Modal',
    color: 'text-purple-600',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    borderColor: 'border-purple-200',
    icon: Wrench,
    description: 'Mesin cuci, dryer UV, rak display, blower, peralatan workshop'
  },
  bahan_baku: {
    label: 'Bahan Baku & Chemical Sabun',
    shortLabel: 'Bahan Baku',
    color: 'text-blue-600',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: Package,
    description: 'Sabun cleaner konsentrat, unyellowing, parfum, sikat bulu kuda'
  },
  operasional: {
    label: 'Operasional & Packaging',
    shortLabel: 'Operasional',
    color: 'text-amber-600',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: ShoppingBag,
    description: 'Plastik ziplock, silica gel, stiker label, listrik, air, internet'
  },
  gaji: {
    label: 'Gaji / Upah Karyawan',
    shortLabel: 'Gaji / Upah',
    color: 'text-teal-600',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    borderColor: 'border-teal-200',
    icon: Users,
    description: 'Honor teknisi cuci sepatu, staf admin, atau kurir pickup'
  },
  sewa: {
    label: 'Sewa Tempat / Kios',
    shortLabel: 'Sewa Tempat',
    color: 'text-rose-600',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderColor: 'border-rose-200',
    icon: Building2,
    description: 'Sewa ruko, kios, lapak workshop bulanan atau tahunan'
  },
  lainnya: {
    label: 'Pengeluaran Lain-lain',
    shortLabel: 'Lain-lain',
    color: 'text-slate-600',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    borderColor: 'border-slate-200',
    icon: HelpCircle,
    description: 'Biaya tak terduga, perbaikan ringan, atau konsumsi kerja'
  }
};

type PeriodFilterType = 'thisMonth' | 'all' | 'today' | 'last7days' | 'lastMonth' | 'custom';

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  expenses,
  adminUser,
  onSaveExpense,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onNavigateToReport
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('thisMonth');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Date range
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    date: string;
    title: string;
    category: ExpenseCategory;
    amount: string;
    paymentMethod: 'tunai' | 'transfer' | 'qris';
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    title: '',
    category: 'belanja_modal',
    amount: '',
    paymentMethod: 'transfer',
    notes: ''
  });

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    if (periodFilter === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (periodFilter === 'last7days') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (periodFilter === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (periodFilter === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (periodFilter === 'custom') {
      start = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null;
      end = customEndDate ? new Date(`${customEndDate}T23:59:59`) : null;
    }

    return expenses.filter(exp => {
      const expDate = new Date(`${exp.date}T12:00:00`);

      if (start && expDate < start) return false;
      if (end && expDate > end) return false;

      if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          exp.title.toLowerCase().includes(q) ||
          (exp.notes && exp.notes.toLowerCase().includes(q)) ||
          exp.paymentMethod.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [expenses, periodFilter, categoryFilter, searchQuery, customStartDate, customEndDate]);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalAll = 0;
    let totalCapex = 0; // Belanja modal
    let totalOpex = 0;  // Operasional + Bahan baku + Gaji + Sewa + Lainnya
    let totalBahanBaku = 0;
    let totalOperasional = 0;

    filteredExpenses.forEach(exp => {
      totalAll += exp.amount;
      if (exp.category === 'belanja_modal') {
        totalCapex += exp.amount;
      } else {
        totalOpex += exp.amount;
      }
      if (exp.category === 'bahan_baku') {
        totalBahanBaku += exp.amount;
      }
      if (exp.category === 'operasional') {
        totalOperasional += exp.amount;
      }
    });

    return {
      totalAll,
      totalCapex,
      totalOpex,
      totalBahanBaku,
      totalOperasional,
      count: filteredExpenses.length
    };
  }, [filteredExpenses]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setFormError(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      category: 'belanja_modal',
      amount: '',
      paymentMethod: 'transfer',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setFormError(null);
    setFormData({
      date: exp.date,
      title: exp.title,
      category: exp.category,
      amount: exp.amount.toString(),
      paymentMethod: exp.paymentMethod,
      notes: exp.notes || ''
    });
    setIsModalOpen(true);
  };

  // Submit Expense Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Mohon isi uraian/judul pengeluaran.');
      return;
    }

    const parsedAmount = parseInt(formData.amount.replace(/[^0-9]/g, ''), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError('Mohon masukkan nominal pengeluaran yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExpense) {
        // Update existing
        const updatedExpense: ExpenseItem = {
          ...editingExpense,
          date: formData.date,
          title: formData.title.trim(),
          category: formData.category,
          amount: parsedAmount,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes.trim() || undefined
        };

        if (onUpdateExpense) {
          await onUpdateExpense(editingExpense.id, {
            date: formData.date,
            title: formData.title.trim(),
            category: formData.category,
            amount: parsedAmount,
            paymentMethod: formData.paymentMethod,
            notes: formData.notes.trim() || undefined
          });
        }
        if (onSaveExpense) {
          await onSaveExpense(updatedExpense);
        }
        setStatusNotice({ message: 'Pengeluaran berhasil diperbarui.', type: 'success' });
      } else {
        // Create new
        const newExpense: ExpenseItem = {
          id: `EXP-${Date.now().toString().slice(-6)}`,
          date: formData.date,
          title: formData.title.trim(),
          category: formData.category,
          amount: parsedAmount,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes.trim() || undefined,
          createdBy: adminUser?.name || 'Admin',
          createdAt: new Date().toISOString()
        };

        if (onAddExpense) {
          await onAddExpense(newExpense);
        }
        if (onSaveExpense) {
          await onSaveExpense(newExpense);
        }
        setStatusNotice({ message: 'Pengeluaran baru berhasil dicatat dan disinkronkan ke Cloud.', type: 'success' });
      }

      setIsModalOpen(false);
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err) {
      console.error('Failed to save expense:', err);
      setFormError('Gagal menyimpan pengeluaran. Mohon periksa koneksi atau coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    setIsSubmitting(true);
    try {
      if (onDeleteExpense) {
        await onDeleteExpense(deletingExpense.id);
      }
      setStatusNotice({ message: 'Data pengeluaran berhasil dihapus.', type: 'success' });
      setDeletingExpense(null);
      setTimeout(() => setStatusNotice(null), 3500);
    } catch (err) {
      console.error('Failed to delete expense:', err);
      setStatusNotice({ message: 'Gagal menghapus data pengeluaran.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-2">
            <Wallet className="w-3.5 h-3.5" />
            <span>Manajemen Pengeluaran & Aset</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Kelola Pengeluaran & Belanja Modal
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Catat belanja modal (mesin/alat workshop), bahan baku cleaner, serta beban operasional untuk perhitungan laba rugi yang akurat.
          </p>
        </div>

        <button
          id="btn-add-expense"
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Catat Pengeluaran Baru</span>
        </button>
      </div>

      {/* Success Notice */}
      {statusNotice && (
        <div className={`p-4 rounded-2xl flex items-center justify-between space-x-3 text-xs font-semibold ${
          statusNotice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusNotice.message}</span>
          </div>
          <button type="button" onClick={() => setStatusNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pengeluaran */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(summary.totalAll)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{summary.count} Transaksi Tercatat</span>
            <span className="text-rose-600 font-bold">Semua Beban</span>
          </div>
        </div>

        {/* Card 2: Belanja Modal (Capex) */}
        <div className="p-5 rounded-3xl bg-white border border-purple-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Belanja Modal (Aset/Alat)</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-900 tracking-tight">
            {formatRupiah(summary.totalCapex)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Mesin, Dryer & Rak</span>
            <span className="text-purple-600 font-bold">Investasi Jangka Panjang</span>
          </div>
        </div>

        {/* Card 3: Bahan Baku & Chemical */}
        <div className="p-5 rounded-3xl bg-white border border-blue-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Bahan Baku & Sabun</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight">
            {formatRupiah(summary.totalBahanBaku)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Cleaner & Sikat Kuda</span>
            <span className="text-blue-600 font-bold">Stok Cuci</span>
          </div>
        </div>

        {/* Card 4: Operasional & Lainnya */}
        <div className="p-5 rounded-3xl bg-white border border-amber-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Beban Operasional</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">
            {formatRupiah(summary.totalOpex - summary.totalBahanBaku)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Packaging, Listrik, Gaji</span>
            <span className="text-amber-600 font-bold">Biaya Rutin</span>
          </div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Row 1: Search & Period Filter */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pengeluaran, nota, supplier, atau catatan..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2" />
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as PeriodFilterType)}
                className="bg-transparent text-xs font-bold text-slate-700 py-1.5 px-2 focus:outline-hidden cursor-pointer"
              >
                <option value="thisMonth">Bulan Ini</option>
                <option value="today">Hari Ini</option>
                <option value="last7days">7 Hari Terakhir</option>
                <option value="lastMonth">Bulan Lalu</option>
                <option value="all">Semua Waktu</option>
                <option value="custom">Rentang Tanggal Khusus</option>
              </select>
            </div>

            {periodFilter === 'custom' && (
              <div className="flex items-center space-x-2 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center">
            <Filter className="w-3 h-3 mr-1" /> Kategori:
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Semua ({expenses.length})
          </button>
          {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map((cat) => {
            const count = expenses.filter(e => e.category === cat).length;
            const config = CATEGORY_CONFIG[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white'
                    : `${config.badgeBg} hover:opacity-80 ${config.badgeText}`
                }`}
              >
                <span>{config.shortLabel}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/10">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Belum Ada Catatan Pengeluaran</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Tidak ditemukan transaksi pengeluaran pada filter dan periode ini. Silakan catat belanja modal atau bahan baku baru.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Pengeluaran Baru</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Uraian / Deskripsi Pengeluaran</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Metode Bayar</th>
                  <th className="px-5 py-3.5 text-right">Nominal Biaya</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const catConfig = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG.lainnya;
                  const IconComp = catConfig.icon;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600 font-medium">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(`${exp.date}T12:00:00`).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{exp.id}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {exp.title}
                        </div>
                        {exp.notes && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {exp.notes}
                          </div>
                        )}
                        {exp.createdBy && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Dicatat oleh: <span className="font-medium text-slate-600">{exp.createdBy}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${catConfig.badgeBg} ${catConfig.badgeText} border ${catConfig.borderColor}`}>
                          <IconComp className="w-3 h-3" />
                          <span>{catConfig.shortLabel}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {exp.paymentMethod}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right font-black text-rose-600 text-sm">
                        -{formatRupiah(exp.amount)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Pengeluaran"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingExpense(exp)}
                            className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Pengeluaran"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Tambah / Edit Pengeluaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-up max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Isi data belanja modal atau biaya operasional secara lengkap.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Pengeluaran *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Pengeluaran *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat].label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {CATEGORY_CONFIG[formData.category].description}
                </p>
              </div>

              {/* Judul / Uraian */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uraian / Judul Pengeluaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mesin Pengering Sepatu UV, 5L Cleaner Sabun, Plastik Klip..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Nominal Biaya */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Biaya (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => {
                      const numOnly = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, amount: numOnly ? parseInt(numOnly, 10).toLocaleString('id-ID') : '' });
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Metode Bayar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['transfer', 'tunai', 'qris'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: method })}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                        formData.paymentMethod === method
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Supplier / No. Struk (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Nama toko, bukti nota pembelian, garansi mesin, atau catatan teknis..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none"
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingExpense ? 'Simpan Perubahan' : 'Catat Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Hapus Pengeluaran */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              Hapus Catatan Pengeluaran?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pengeluaran <strong className="text-slate-800">"{deletingExpense.title}"</strong> senilai <strong className="text-rose-600 font-bold">{formatRupiah(deletingExpense.amount)}</strong> akan dihapus permanen dari sistem dan cloud.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
