import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Printer, 
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
  AlertCircle
} from 'lucide-react';
import { CustomerOrder, AdminSettings, AdminUser } from '../types';
import { formatRupiah } from '../utils/storage';
import { RevenueChart } from './RevenueChart';
import { 
  exportFinancialToExcel, 
  exportFinancialToPDF, 
  FinancialSummaryData 
} from '../utils/exportReport';

interface FinancialReportProps {
  orders: CustomerOrder[];
  settings: AdminSettings;
  adminUser?: AdminUser | null;
  onViewInvoice?: (order: CustomerOrder) => void;
}

type PeriodFilterType = 'all' | 'today' | 'last7days' | 'thisMonth' | 'lastMonth' | 'custom';
type StatusFilterType = 'all' | 'completed_only' | 'in_progress' | 'exclude_cancelled';

export const FinancialReport: React.FC<FinancialReportProps> = ({
  orders,
  settings,
  adminUser,
  onViewInvoice
}) => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('thisMonth');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('exclude_cancelled');
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

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Compute filtered orders
  const { filteredOrders, periodLabel } = useMemo(() => {
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

    const filtered = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      // Period match
      if (start && orderDate < start) return false;
      if (end && orderDate > end) return false;

      // Status match
      if (statusFilter === 'completed_only' && order.status !== 'selesai') return false;
      if (statusFilter === 'in_progress' && (order.status === 'selesai' || order.status === 'dibatalkan')) return false;
      if (statusFilter === 'exclude_cancelled' && order.status === 'dibatalkan') return false;

      // Search match
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

    return { filteredOrders: filtered, periodLabel: label };
  }, [orders, periodFilter, statusFilter, customStartDate, customEndDate, searchQuery]);

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

        if (o.status === 'selesai') {
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
    const completedOrdersCount = filteredOrders.filter(o => o.status === 'selesai').length;
    const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

    const serviceBreakdown = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);

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
      deliveryFeesTotalRevenue
    };
  }, [filteredOrders, periodLabel]);

  // Excel Export Handler
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      exportFinancialToExcel(filteredOrders, summary, settings, adminUser);
      setExportSuccessMessage('File Excel (.xlsx) berhasil diunduh ke perangkat Anda!');
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
      exportFinancialToPDF(filteredOrders, summary, settings, adminUser);
      setExportSuccessMessage('Laporan Keuangan PDF (.pdf) resmi berhasil dibuat & diunduh!');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Terjadi kesalahan saat mengekspor PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Direct Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Buttons */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Laporan Keuangan
            </span>
            <span className="text-xs text-slate-500 font-medium">
              SipSepatu Financial Ledger
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Rekap Pendapatan, Omset & Arus Transaksi
          </h2>
          <p className="text-xs text-slate-500">
            Pantau performa omset cuci sepatu, rincian per layanan, dan unduh laporan resmi untuk pembukuan.
          </p>
        </div>

        {/* Export action button group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel Button */}
          <button
            id="btn-export-excel"
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel || filteredOrders.length === 0}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Export data keuangan ke format Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>{isExportingExcel ? 'Memproses Excel...' : 'Export Excel (.xlsx)'}</span>
          </button>

          {/* Export PDF Button */}
          <button
            id="btn-export-pdf"
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF || filteredOrders.length === 0}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Export dan unduh laporan keuangan resmi dalam format PDF"
          >
            <FileText className="w-4 h-4 text-rose-100" />
            <span>{isExportingPDF ? 'Membuat PDF...' : 'Export PDF'}</span>
          </button>

          {/* Print Button */}
          <button
            id="btn-print-report"
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Cetak langsung atau simpan via print dialog"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Cetak</span>
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
            className="text-emerald-600 hover:text-emerald-800 p-1"
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

          {/* Status filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </span>
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="exclude_cancelled">Semua (Kecuali Batal)</option>
              <option value="completed_only">Hanya Selesai (Lunas)</option>
              <option value="in_progress">Dalam Proses / Antrean</option>
              <option value="all">Semua Termasuk Batal</option>
            </select>
          </div>
        </div>

        {/* Custom date range inputs & Search bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {periodFilter === 'custom' ? (
            <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
              <span className="text-slate-500 font-medium">Dari:</span>
              <input
                id="input-custom-start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-slate-500 font-medium">s/d</span>
              <input
                id="input-custom-end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-medium">
              Menampilkan data untuk <span className="font-bold text-slate-800">{periodLabel}</span>
            </div>
          )}

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="input-financial-search"
              type="text"
              placeholder="Cari resi, nama, atau layanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
      </div>

      {/* KPI Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Omset Kotor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Omset Kotor</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(summary.totalRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <span>{summary.totalOrdersCount} transaksi tercatat</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{summary.totalPairsCount} pasang</span>
            </p>
          </div>
        </div>

        {/* Card 2: Pendapatan Selesai / Realisasi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendapatan Realisasi</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {formatRupiah(summary.completedRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Dari {summary.completedOrdersCount} pesanan berstatus selesai/lunas
            </p>
          </div>
        </div>

        {/* Card 3: Pendapatan Dalam Proses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Potensi Berjalan</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {formatRupiah(summary.inProgressRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pesanan aktif yang sedang dicuci atau menunggu konfirmasi
            </p>
          </div>
        </div>

        {/* Card 4: Rata-rata Nilai Order (AOV) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Rata-Rata Transaksi</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(summary.averageOrderValue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Rata-rata pengeluaran per pelanggan
            </p>
          </div>
        </div>
      </div>

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

        {/* Right 1 Col: Add-ons & Logistics Contribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Layers className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Pendapatan Tambahan & Logistik
              </h3>
            </div>

            <div className="space-y-3">
              {/* Addons Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-medium text-slate-700">Layanan Tambahan (Add-Ons)</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(summary.addOnsTotalRevenue)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Unyellowing, Waterproofing nano-spray, & Fast Clean
                </p>
              </div>

              {/* Delivery Fee Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium text-slate-700">Ongkir Antar-Jemput</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(summary.deliveryFeesTotalRevenue)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Biaya operasional kurir jemput dan antar ke alamat
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Dihitung otomatis per pesanan</span>
            <span className="font-semibold text-emerald-600">SipSepatu System</span>
          </div>
        </div>
      </div>

      {/* Detailed Transaction Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Buku Kas Rincian Transaksi ({filteredOrders.length} Catatan)
            </h3>
            <p className="text-xs text-slate-500">
              Daftar seluruh transaksi yang masuk ke dalam periode hitung ini.
            </p>
          </div>

          <div className="text-xs text-slate-600 font-medium">
            Total Kas Periode Ini:{' '}
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
                <th className="py-3 px-4 text-right">Ongkir</th>
                <th className="py-3 px-4 text-right">Total (Rp)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
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
                      {/* Order ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {order.id}
                      </td>

                      {/* Date */}
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

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{order.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{order.customerPhone}</div>
                      </td>

                      {/* Service & Pairs */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{order.serviceName}</span>
                        <span className="ml-1 text-[11px] text-slate-500">({order.pairCount} pasang)</span>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">
                          {order.shoeDetails.map(s => s.brandModel).filter(Boolean).join(', ') || 'Sepatu'}
                        </div>
                      </td>

                      {/* Service Price */}
                      <td className="py-3 px-4 text-right text-slate-700">
                        {formatRupiah(order.servicePrice * order.pairCount)}
                      </td>

                      {/* Add-ons */}
                      <td className="py-3 px-4 text-right text-slate-700">
                        {order.addOnsTotal > 0 ? formatRupiah(order.addOnsTotal) : '-'}
                      </td>

                      {/* Delivery */}
                      <td className="py-3 px-4 text-right text-slate-700">
                        {order.deliveryFee > 0 ? formatRupiah(order.deliveryFee) : '-'}
                      </td>

                      {/* Total Price */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        <span className={isCompleted ? 'text-emerald-700' : ''}>
                          {formatRupiah(order.totalPrice)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          order.status === 'selesai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'dibatalkan'
                            ? 'bg-rose-100 text-rose-800'
                            : order.status === 'dalam_proses'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status === 'selesai' ? 'Lunas / Selesai' : order.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        {onViewInvoice && (
                          <button
                            type="button"
                            onClick={() => onViewInvoice(order)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 inline-flex items-center space-x-1"
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

            {/* Total Row */}
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
                  <td className="py-3 px-4 text-right">
                    {formatRupiah(summary.deliveryFeesTotalRevenue)}
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

      {/* Official Sign-off and Information Footer */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          <p className="font-semibold text-slate-700">SIPSEPATU CARE STUDIO - SISTEM KEUANGAN OUTLET</p>
          <p className="text-[11px] mt-0.5">
            Laporan ini dibuat secara otomatis dari basis data transaksi pesanan cuci sepatu.
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
