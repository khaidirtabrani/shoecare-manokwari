import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  BarChart3, 
  Search, 
  RefreshCw, 
  Truck, 
  Sparkles,
  Layers,
  X,
  Eye,
  AlertCircle,
  TrendingDown,
  Scale,
  Wrench,
  Package,
  ShoppingBag,
  Building2,
  Users,
  Check,
  Percent,
  Landmark
} from 'lucide-react';
import { CustomerOrder, AdminSettings, AdminUser, ExpenseItem, ExpenseCategory, InitialCapitalItem } from '../types';
import { formatRupiah } from '../utils/storage';
import { RevenueChart } from './RevenueChart';
import { 
  exportFinancialToExcel, 
  exportFinancialToPDF, 
  FinancialSummaryData 
} from '../utils/exportReport';
import { CATEGORY_CONFIG } from './ExpenseManager';

interface FinancialReportProps {
  orders: CustomerOrder[];
  expenses?: ExpenseItem[];
  capitals?: InitialCapitalItem[];
  settings: AdminSettings;
  adminUser?: AdminUser | null;
  onViewInvoice?: (order: CustomerOrder) => void;
  onNavigateToExpenses?: () => void;
  onNavigateToCapital?: () => void;
}

type PeriodFilterType = 'all' | 'today' | 'last7days' | 'thisMonth' | 'lastMonth' | 'custom';
type StatusFilterType = 'all' | 'completed_only' | 'in_progress' | 'exclude_cancelled' | 'cancelled_only';
type ActiveSubViewType = 'summary_pnl' | 'orders_table' | 'expenses_table';

export const FinancialReport: React.FC<FinancialReportProps> = ({
  orders,
  expenses = [],
  capitals = [],
  settings,
  adminUser,
  onViewInvoice,
  onNavigateToExpenses,
  onNavigateToCapital
}) => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('thisMonth');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubView, setActiveSubView] = useState<ActiveSubViewType>('summary_pnl');

  const totalCapitalAmount = useMemo(() => {
    return capitals.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [capitals]);
  
  // Custom Date range
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Compute filtered orders and expenses
  const { filteredOrders, filteredExpenses, periodLabel } = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;
    let label = 'Semua Waktu';

    if (periodFilter === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      label = `Hari Ini (${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    } else if (periodFilter === 'last7days') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      label = '7 Hari Terakhir';
    } else if (periodFilter === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      label = `Bulan ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    } else if (periodFilter === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      label = `Bulan ${lastMonthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    } else if (periodFilter === 'custom') {
      start = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null;
      end = customEndDate ? new Date(`${customEndDate}T23:59:59`) : null;
      label = `${customStartDate || 'Awal'} s/d ${customEndDate || 'Akhir'}`;
    }

    // Filter Orders
    const filteredO = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      if (start && orderDate < start) return false;
      if (end && orderDate > end) return false;

      if (statusFilter === 'completed_only' && order.status !== 'selesai') return false;
      if (statusFilter === 'in_progress' && (order.status === 'selesai' || order.status === 'dibatalkan')) return false;
      if (statusFilter === 'exclude_cancelled' && order.status === 'dibatalkan') return false;
      if (statusFilter === 'cancelled_only' && order.status !== 'dibatalkan') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          order.id.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.customerPhone.includes(q) ||
          order.serviceName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });

    // Filter Expenses
    const filteredE = expenses.filter((exp) => {
      const expDate = new Date(`${exp.date}T12:00:00`);
      if (start && expDate < start) return false;
      if (end && expDate > end) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          exp.title.toLowerCase().includes(q) ||
          (exp.notes && exp.notes.toLowerCase().includes(q)) ||
          exp.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });

    return { 
      filteredOrders: filteredO, 
      filteredExpenses: filteredE, 
      periodLabel: label 
    };
  }, [orders, expenses, periodFilter, statusFilter, customStartDate, customEndDate, searchQuery]);

  // Compute financial metrics & summary
  const summary: FinancialSummaryData = useMemo(() => {
    let totalRevenue = 0;
    let completedRevenue = 0;
    let inProgressRevenue = 0;
    let totalPairsCount = 0;
    let addOnsTotalRevenue = 0;
    let deliveryFeesTotalRevenue = 0;

    const serviceMap: { [key: string]: { name: string; count: number; revenue: number } } = {};

    filteredOrders.forEach((o) => {
      const isCancelled = o.status === 'dibatalkan';
      if (!isCancelled) {
        totalRevenue += o.totalPrice;
        totalPairsCount += o.pairCount;
        addOnsTotalRevenue += o.addOnsTotal;
        deliveryFeesTotalRevenue += o.deliveryFee;

        if (o.status === 'selesai' || o.paymentStatus === 'sudah_bayar') {
          completedRevenue += o.totalPrice;
        } else {
          inProgressRevenue += o.totalPrice;
        }

        const svcKey = o.serviceName;
        if (!serviceMap[svcKey]) {
          serviceMap[svcKey] = { name: svcKey, count: 0, revenue: 0 };
        }
        serviceMap[svcKey].count += o.pairCount;
        serviceMap[svcKey].revenue += (o.servicePrice * o.pairCount);
      }
    });

    const totalOrdersCount = filteredOrders.filter(o => o.status !== 'dibatalkan').length;
    const completedOrdersCount = filteredOrders.filter(o => o.status === 'selesai' || o.paymentStatus === 'sudah_bayar').length;
    const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
    const serviceBreakdown = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);

    // Expenses calculation
    let totalExpenses = 0;
    let capexExpenses = 0; // Belanja Modal (Investasi Alat/Mesin)
    let opexExpenses = 0;  // Operasional, Bahan Baku, Gaji, dll.

    filteredExpenses.forEach(exp => {
      totalExpenses += exp.amount;
      if (exp.category === 'belanja_modal') {
        capexExpenses += exp.amount;
      } else {
        opexExpenses += exp.amount;
      }
    });

    // Net Profit = Pemasukan Realisasi / Lunas - Total Pengeluaran
    const netProfit = completedRevenue - totalExpenses;
    const isProfitable = netProfit >= 0;
    const profitMargin = completedRevenue > 0 
      ? Math.round((netProfit / completedRevenue) * 100)
      : 0;

    return {
      periodLabel,
      totalRevenue,
      completedRevenue,
      inProgressRevenue,
      totalOrdersCount,
      completedOrdersCount,
      totalPairsCount,
      averageOrderValue,
      serviceBreakdown,
      addOnsTotalRevenue,
      deliveryFeesTotalRevenue,
      totalExpenses,
      capexExpenses,
      opexExpenses,
      netProfit,
      isProfitable,
      profitMargin
    };
  }, [filteredOrders, filteredExpenses, periodLabel]);

  // Excel Export Handler
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      exportFinancialToExcel(filteredOrders, summary, settings, adminUser, filteredExpenses);
      setExportSuccessMessage('Laporan Keuangan & Laba Rugi Excel (.xlsx) berhasil diunduh!');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export excel:', err);
      alert('Terjadi kesalahan saat mengekspor Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // PDF Export Handler
  const handleExportPDF = () => {
    try {
      setIsExportingPDF(true);
      exportFinancialToPDF(filteredOrders, summary, settings, adminUser, filteredExpenses);
      setExportSuccessMessage('Laporan Laba Rugi Resmi PDF (.pdf) berhasil dibuat & diunduh!');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Terjadi kesalahan saat mengekspor PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Buttons */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Laporan Keuangan & Laba Rugi
            </span>
            <span className="text-xs text-slate-500 font-medium">
              SipSepatu Financial & P&L Statement
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Laporan Pendapatan, Pengeluaran & Laba Rugi
          </h2>
          <p className="text-xs text-slate-500">
            Kalkulasi otomatis omset pesanan lunas, belanja modal alat, beban operasional, serta posisi laba bersih (untung/rugi).
          </p>
        </div>

        {/* Export action button group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel Button */}
          <button
            id="btn-export-excel"
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel || (filteredOrders.length === 0 && filteredExpenses.length === 0)}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Export data keuangan & laba rugi ke Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>{isExportingExcel ? 'Memproses Excel...' : 'Export Excel (.xlsx)'}</span>
          </button>

          {/* Export PDF Button */}
          <button
            id="btn-export-pdf"
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF || (filteredOrders.length === 0 && filteredExpenses.length === 0)}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Export laporan laba rugi resmi dalam format PDF"
          >
            <FileText className="w-4 h-4 text-rose-100" />
            <span>{isExportingPDF ? 'Membuat PDF...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {exportSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{exportSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Period presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Periode:</span>
            </span>

            {[
              { key: 'thisMonth', label: 'Bulan Ini' },
              { key: 'today', label: 'Hari Ini' },
              { key: 'last7days', label: '7 Hari Terakhir' },
              { key: 'lastMonth', label: 'Bulan Lalu' },
              { key: 'all', label: 'Semua Waktu' },
              { key: 'custom', label: 'Kustom Rentang' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                id={`btn-period-${tab.key}`}
                onClick={() => setPeriodFilter(tab.key as PeriodFilterType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  periodFilter === tab.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="input-financial-search"
              type="text"
              placeholder="Cari transaksi atau pengeluaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Range Picker */}
        {periodFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-semibold">Rentang Tanggal:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
            />
            <span className="text-xs text-slate-400">-</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🌟 EXECUTIVE PROFIT & LOSS (LABA / RUGI) CARD */}
      {/* ========================================================================= */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-md relative overflow-hidden transition-all ${
        summary.isProfitable 
          ? 'bg-linear-to-br from-slate-900 via-slate-800 to-emerald-950 text-white border-emerald-500/30' 
          : 'bg-linear-to-br from-slate-900 via-slate-800 to-rose-950 text-white border-rose-500/30'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 backdrop-blur-md flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Analisis Laba Rugi (P&L)</span>
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Periode: {summary.periodLabel}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Ringkasan Untung & Rugi Usaha
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Perhitungan laba bersih riil didapat dari seluruh pemasukan pesanan cuci sepatu dikurangi total pengeluaran (belanja modal & beban operasional).
            </p>
          </div>

          {/* Profit or Loss Status Badge */}
          <div className="text-left md:text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Status Finansial Periode Ini
            </span>
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl font-black text-sm sm:text-base border shadow-lg ${
              summary.isProfitable
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-emerald-950/50'
                : 'bg-rose-500/20 text-rose-300 border-rose-400/40 shadow-rose-950/50'
            }`}>
              {summary.isProfitable ? (
                <>
                  <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>SURPLUS / UNTUNG</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>DEFISIT / RUGI</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3 Major Pillars: Pemasukan vs Pengeluaran vs Laba Bersih */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Pillar 1: Total Pemasukan Lunas */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-300 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                1. Total Pemasukan (Omset)
              </span>
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatRupiah(summary.completedRevenue)}
            </div>
            <div className="text-[11px] text-slate-300 mt-2 space-y-0.5">
              <div>Dari <strong className="text-white">{summary.completedOrdersCount}</strong> transaksi lunas/selesai</div>
              <div className="text-slate-400">Total volume: {summary.totalPairsCount} pasang sepatu</div>
            </div>
          </div>

          {/* Pillar 2: Total Pengeluaran */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-300 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                2. Total Pengeluaran
              </span>
              <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-300 tracking-tight">
              -{formatRupiah(summary.totalExpenses || 0)}
            </div>
            <div className="text-[11px] text-slate-300 mt-2 space-y-0.5">
              <div className="flex justify-between">
                <span>Belanja Modal (Alat/Mesin):</span>
                <strong className="text-purple-300">{formatRupiah(summary.capexExpenses || 0)}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Operasional & Bahan:</span>
                <strong className="text-amber-300">{formatRupiah(summary.opexExpenses || 0)}</strong>
              </div>
            </div>
          </div>

          {/* Pillar 3: Hasil Akhir (Laba / Rugi Bersih) */}
          <div className={`p-5 rounded-2xl border backdrop-blur-xs ${
            summary.isProfitable
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-100'
              : 'bg-rose-950/50 border-rose-500/40 text-rose-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                summary.isProfitable ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                3. Laba / Rugi Bersih
              </span>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                summary.isProfitable ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
              }`}>
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
              summary.isProfitable ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              {summary.netProfit >= 0 ? '+' : ''}{formatRupiah(summary.netProfit || 0)}
            </div>
            <div className="text-[11px] mt-2 space-y-0.5">
              <div className="font-semibold">
                Marjin Laba Bersih: <span className="underline font-bold">{summary.profitMargin}%</span>
              </div>
              <div className="text-slate-300 text-[10px]">
                {summary.isProfitable 
                  ? 'Kondisi kas sehat, pendapatan melampaui seluruh beban.' 
                  : 'Pengeluaran melebihi pemasukan (wajar saat ada belanja modal baru).'}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar: Pemasukan vs Pengeluaran Proportion */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-semibold">
              Rasio Pemasukan vs Pengeluaran Usaha
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {formatRupiah(summary.completedRevenue)} vs {formatRupiah(summary.totalExpenses || 0)}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-950/60 overflow-hidden flex">
            {summary.completedRevenue + (summary.totalExpenses || 0) > 0 ? (
              <>
                <div 
                  className="bg-emerald-500 h-full transition-all duration-700" 
                  style={{ 
                    width: `${Math.min(100, Math.round((summary.completedRevenue / (summary.completedRevenue + (summary.totalExpenses || 0))) * 100))}%` 
                  }}
                  title="Pemasukan"
                />
                <div 
                  className="bg-rose-500 h-full transition-all duration-700" 
                  style={{ 
                    width: `${Math.min(100, Math.round(((summary.totalExpenses || 0) / (summary.completedRevenue + (summary.totalExpenses || 0))) * 100))}%` 
                  }}
                  title="Pengeluaran"
                />
              </>
            ) : (
              <div className="w-full bg-slate-700 h-full" />
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" /> Pemasukan (Omset Lunas)</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5" /> Total Pengeluaran (Belanja Modal & Beban)</span>
          </div>
        </div>

        {/* Modal Awal & Posisi Kas Usaha Quick Banner */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Modal Awal Masuk:</span>
                <span className="text-indigo-300 font-black">{formatRupiah(totalCapitalAmount)}</span>
                <span className="text-slate-400 text-[10px] font-normal">({capitals.length} catatan)</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Estimasi Posisi Kas (Modal + Omset - Beban): <strong className={totalCapitalAmount + summary.completedRevenue - (summary.totalExpenses || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {formatRupiah(totalCapitalAmount + summary.completedRevenue - (summary.totalExpenses || 0))}
                </strong>
              </div>
            </div>
          </div>

          {onNavigateToCapital && (
            <button
              type="button"
              onClick={onNavigateToCapital}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Kelola Modal Awal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-View Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubView('summary_pnl')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubView === 'summary_pnl'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Grafik & Rincian Layanan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('orders_table')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubView === 'orders_table'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Buku Kas Pesanan Masuk ({filteredOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('expenses_table')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubView === 'expenses_table'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Rincian Buku Pengeluaran ({filteredExpenses.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: SUMMARY & ANALYTICS CHARTS */}
      {/* ========================================================================= */}
      {activeSubView === 'summary_pnl' && (
        <div className="space-y-6 animate-fade-in">
          {/* Visual Analytics Chart */}
          <RevenueChart orders={filteredOrders} />

          {/* Revenue Breakdown by Service & Extras */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Services Breakdown */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Kontribusi Pendapatan per Paket Layanan
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Berdasarkan Volume Cuci</span>
              </div>

              {summary.serviceBreakdown.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Tidak ada data layanan pada periode yang dipilih.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {summary.serviceBreakdown.map((svc) => {
                    const percentage = summary.totalRevenue > 0 
                      ? Math.round((svc.revenue / summary.totalRevenue) * 100) 
                      : 0;

                    return (
                      <div key={svc.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-800">{svc.name}</span>
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                              {svc.count} pasang
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900">{formatRupiah(svc.revenue)}</span>
                            <span className="text-[11px] text-slate-400 ml-1.5">({percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 1 Col: Summary of Expense Categories */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Rekap Beban Pengeluaran
                  </h3>
                </div>

                <div className="space-y-3">
                  {/* Belanja Modal Item */}
                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Wrench className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Belanja Modal (Aset/Alat)</span>
                      </div>
                      <span className="font-black text-purple-900">
                        {formatRupiah(summary.capexExpenses || 0)}
                      </span>
                    </div>
                    <p className="text-[10px] text-purple-700 mt-1">
                      Mesin dryer, rak antrean, alat workshop
                    </p>
                  </div>

                  {/* Beban Operasional & Bahan Baku */}
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Bahan Baku & Operasional</span>
                      </div>
                      <span className="font-black text-blue-900">
                        {formatRupiah(summary.opexExpenses || 0)}
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-700 mt-1">
                      Sabun, parfum, kemasan plastik, listrik & utilitas
                    </p>
                  </div>

                  {/* Add-ons revenue recap */}
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-semibold text-amber-900">Pendapatan Add-Ons</span>
                      </div>
                      <span className="font-black text-amber-900">
                        {formatRupiah(summary.addOnsTotalRevenue)}
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-700 mt-1">
                      Unyellowing, fast clean, waterproofing
                    </p>
                  </div>
                </div>
              </div>

              {onNavigateToExpenses && (
                <button
                  type="button"
                  onClick={onNavigateToExpenses}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  Kelola Pengeluaran Usaha →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: ORDERS TRANSACTION TABLE */}
      {/* ========================================================================= */}
      {activeSubView === 'orders_table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Buku Kas Rincian Transaksi Masuk ({filteredOrders.length} Pesanan)
              </h3>
              <p className="text-xs text-slate-500">
                Daftar seluruh pesanan pelanggan yang masuk ke dalam periode hitung ini.
              </p>
            </div>

            <div className="text-xs text-slate-600 font-medium">
              Total Omset Periode Ini:{' '}
              <span className="font-bold text-emerald-700 text-sm">
                {formatRupiah(summary.totalRevenue)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">No. Resi</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Paket & Pasang</th>
                  <th className="py-3 px-4 text-right">Biaya Cuci</th>
                  <th className="py-3 px-4 text-right">Add-Ons</th>
                  <th className="py-3 px-4 text-right">Total (Rp)</th>
                  <th className="py-3 px-4 text-center">Status & Pembayaran</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      <p className="font-medium">Tidak ada transaksi ditemukan pada filter ini.</p>
                      <p className="text-[11px] mt-1">Coba sesuaikan filter tanggal atau kata kunci pencarian Anda.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isCancelled = order.status === 'dibatalkan';
                    const isCompleted = order.status === 'selesai';

                    return (
                      <tr 
                        key={order.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCancelled ? 'opacity-60 bg-rose-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {order.id}
                        </td>

                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                          <div className="text-[10px] text-slate-400">
                            {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{order.customerName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{order.customerPhone}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800">{order.serviceName}</span>
                          <span className="ml-1 text-[11px] text-slate-500">({order.pairCount} pasang)</span>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            {order.shoeDetails.map(s => s.brandModel).filter(Boolean).join(', ') || 'Sepatu'}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right text-slate-700">
                          {formatRupiah(order.servicePrice * order.pairCount)}
                        </td>

                        <td className="py-3 px-4 text-right text-slate-700">
                          {order.addOnsTotal > 0 ? formatRupiah(order.addOnsTotal) : '-'}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          <span className={isCompleted ? 'text-emerald-700' : ''}>
                            {formatRupiah(order.totalPrice)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center space-y-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              order.status === 'selesai'
                                ? 'bg-slate-100 text-slate-800'
                                : order.status === 'dibatalkan'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : order.status === 'dalam_proses'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {order.status === 'dibatalkan' ? 'Dibatalkan' : order.status.replace(/_/g, ' ')}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              order.paymentStatus === 'sudah_bayar'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {order.paymentStatus === 'sudah_bayar' ? 'LUNAS' : 'BELUM BAYAR'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {onViewInvoice && (
                            <button
                              type="button"
                              onClick={() => onViewInvoice(order)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 inline-flex items-center space-x-1 cursor-pointer"
                              title="Lihat Nota / Kwitansi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline text-[10px]">Nota</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {filteredOrders.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider">
                      Total Keseluruhan Periode Ini:
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatRupiah(filteredOrders.reduce((sum, o) => sum + (o.status !== 'dibatalkan' ? o.servicePrice * o.pairCount : 0), 0))}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatRupiah(summary.addOnsTotalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-800 text-sm font-extrabold">
                      {formatRupiah(summary.totalRevenue)}
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-center text-slate-500 font-normal text-[11px]">
                      {summary.totalOrdersCount} Transaksi
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: EXPENSES TRANSACTION TABLE */}
      {/* ========================================================================= */}
      {activeSubView === 'expenses_table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Buku Rincian Pengeluaran Usaha ({filteredExpenses.length} Catatan)
              </h3>
              <p className="text-xs text-slate-500">
                Seluruh belanja modal (aset workshop), bahan baku cleaner, dan beban operasional pada periode ini.
              </p>
            </div>

            <div className="text-xs text-slate-600 font-medium">
              Total Pengeluaran Periode Ini:{' '}
              <span className="font-bold text-rose-600 text-sm">
                -{formatRupiah(summary.totalExpenses || 0)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Uraian Pengeluaran</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4 text-right">Nominal Biaya</th>
                  <th className="py-3 px-4">Catatan / Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <p className="font-medium">Tidak ada pengeluaran tercatat pada periode ini.</p>
                      {onNavigateToExpenses && (
                        <button
                          type="button"
                          onClick={onNavigateToExpenses}
                          className="mt-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                        >
                          Catat Pengeluaran Baru
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const catConfig = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG.lainnya;
                    const IconComp = catConfig.icon;
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {new Date(`${exp.date}T12:00:00`).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{exp.id}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{exp.title}</div>
                          {exp.createdBy && (
                            <div className="text-[10px] text-slate-400">Oleh: {exp.createdBy}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${catConfig.badgeBg} ${catConfig.badgeText} border ${catConfig.borderColor}`}>
                            <IconComp className="w-3 h-3" />
                            <span>{catConfig.shortLabel}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap uppercase font-mono text-[11px] text-slate-700">
                          {exp.paymentMethod}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-right font-black text-rose-600 text-sm">
                          -{formatRupiah(exp.amount)}
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {exp.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {filteredExpenses.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider">
                      Total Pengeluaran Periode Ini:
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600 text-sm font-extrabold">
                      -{formatRupiah(summary.totalExpenses || 0)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-normal text-[11px]">
                      {filteredExpenses.length} Transaksi Beban
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Official Sign-off and Information Footer */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          <p className="font-semibold text-slate-700">SIPSEPATU CARE STUDIO - SISTEM PEMBUKUAN & LABA RUGI</p>
          <p className="text-[11px] mt-0.5">
            Laporan ini dibuat otomatis menghubungkan data pesanan pelanggan dan buku pengeluaran usaha.
          </p>
        </div>
        <div className="text-right text-[11px]">
          <p>Admin Bertugas: <span className="font-semibold text-slate-700">{adminUser?.name || 'Super Admin'}</span></p>
          <p>Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
        </div>
      </div>
    </div>
  );
};
